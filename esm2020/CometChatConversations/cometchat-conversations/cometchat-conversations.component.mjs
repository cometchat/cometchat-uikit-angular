import "@cometchat/uikit-elements";
import { AvatarStyle, BadgeStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle, } from "@cometchat/uikit-elements";
import { CometChatSoundManager, CometChatUIKitUtility, ConversationUtils, ConversationsStyle, ListStyle, MessageReceiptUtils, } from "@cometchat/uikit-shared";
import { CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatUIKitConstants, CometChatUserEvents, DatePatterns, MentionsTargetElement, MessageStatus, SelectionMode, States, TitleAlignment, fontHelper, localize, } from "@cometchat/uikit-resources";
import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import { CometChatUIKit } from "../../Shared/CometChatUIkit/CometChatUIKit";
import { MessageUtils } from "../../Shared/Utils/MessageUtils";
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
        this.disableReceipt = false;
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
        this.deleteConversationDialogStyle = new ConfirmDialogStyle({
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
            borderRadius: "8px",
        });
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
            if (!this.disableUsersPresence) {
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
            }
            return null;
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
        let item = conversation.getConversationWith();
        if (item instanceof CometChat.User) {
            let userStatusVisibility = new MessageUtils().getUserStatusVisibility(item) || this.disableUsersPresence;
            if (!userStatusVisibility)
                return this.statusColor[item?.getStatus()];
            else
                return null;
        }
        else {
            return this.statusColor[item?.getType()];
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
                if (conversation && !this.requestBuilder?.isIncludeBlockedUsers()) {
                    this.removeConversation(conversation);
                }
                else {
                    this.updateUser(item);
                }
                this.ref.detectChanges();
            });
            this.ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe((item) => {
                let conversation = this.getConversationFromUser(item);
                if (conversation && this.requestBuilder?.isIncludeBlockedUsers()) {
                    this.updateUser(item);
                }
                this.ref.detectChanges();
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
        this.ccUserUnblocked?.unsubscribe();
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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1oscUJBQXFCLEVBQ3JCLGFBQWEsRUFFYixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFFZCxVQUFVLEVBQ1YsUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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LFFBQVE7c0JBQWhCLEtBQUs7Z0JBSUcsY0FBYztzQkFBdEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFFRyxZQUFZO3NCQUFwQixLQUFLO2dCQUNHLElBQUk7c0JBQVosS0FBSztnQkFDRyxhQUFhO3NCQUFyQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBQ0csdUJBQXVCO3NCQUEvQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUNHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFHRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLDZCQUE2QjtzQkFBckMsS0FBSztnQkFzQkcsYUFBYTtzQkFBckIsS0FBSztnQkFNRyxVQUFVO3NCQUFsQixLQUFLO2dCQVFHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBSUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQU1HLGFBQWE7c0JBQXJCLEtBQUs7Z0JBSUcsb0JBQW9CO3NCQUE1QixLQUFLO2dCQUtHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQWtIRyxZQUFZO3NCQUFwQixLQUFLO2dCQUdHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcblxuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhZGdlU3R5bGUsXG4gIENvbmZpcm1EaWFsb2dTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBJY29uU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIFJlY2VpcHRTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEJhc2VTdHlsZSxcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIENvbnZlcnNhdGlvblV0aWxzLFxuICBDb252ZXJzYXRpb25zU3R5bGUsXG4gIExpc3RTdHlsZSxcbiAgTWVzc2FnZVJlY2VpcHRVdGlscyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDYXJkTWVzc2FnZSxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgQ29tZXRDaGF0VXNlckV2ZW50cyxcbiAgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICBEYXRlUGF0dGVybnMsXG4gIEZvcm1NZXNzYWdlLFxuICBJR3JvdXBMZWZ0LFxuICBJR3JvdXBNZW1iZXJBZGRlZCxcbiAgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLFxuICBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQsXG4gIElNZXNzYWdlcyxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBTY2hlZHVsZXJNZXNzYWdlLFxuICBTZWxlY3Rpb25Nb2RlLFxuICBTdGF0ZXMsXG4gIFRpdGxlQWxpZ25tZW50LFxuICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBIb3N0QmluZGluZyxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBEb21TYW5pdGl6ZXIsIFNhZmVIdG1sIH0gZnJvbSBcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRDb252ZXJzYXRpb24gaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29udmVyc2F0aW9uTGlzdENvbXBvbmVudC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY29udmVyc2F0aW9uc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENvbnZlcnNhdGlvbnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0hBVFNcIik7IC8vVGl0bGUgb2YgdGhlIGNvbXBvbmVudFxuICBASW5wdXQoKSBvcHRpb25zITpcbiAgICB8ICgoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiBDb21ldENoYXRPcHRpb25bXSlcbiAgICB8IG51bGw7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlSG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTsgLy8gcGxhY2Vob2xkZXIgdGV4dCBvZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVR5cGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkZWxpdmVyZWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLWRlbGl2ZXJlZC5zdmdcIjtcbiAgQElucHV0KCkgcmVhZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtcmVhZC5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YXJuaW5nLXNtYWxsLnN2Z1wiO1xuICBASW5wdXQoKSBkYXRlUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBzZW50SWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1zZW50LnN2Z1wiO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWRcbiAgICpcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGFjdGl2ZUNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPSBudWxsOyAvL3NlbGVjdGVkIGNvbnZlcnNhdGlvblxuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7IC8vaW1hZ2UgVVJMIG9mIHRoZSBzZWFyY2ggaWNvblxuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTsgLy9zd2l0Y2ggb24vZmYgc2VhcmNoIGlucHV0XG4gIEBJbnB1dCgpIGNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAoXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLFxuICAgIHNlbGVjdGVkOiBib29sZWFuXG4gICkgPT4gdm9pZDtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX0NIQVRTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG5cbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY29uZmlybURpYWxvZ1RpdGxlID0gbG9jYWxpemUoXCJERUxFVEVfQ09OVkVSU0FUSU9OXCIpO1xuICBASW5wdXQoKSBjb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGNhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBjb25maXJtRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXG4gICAgXCJXT1VMRF9fWU9VX0xJS0VfVE9fREVMRVRFX1RISVNfQ09OVkVSU0FUSU9OXCJcbiAgKTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB2b2lkO1xuICBASW5wdXQoKSBkZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICBjYW5jZWxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFNlY29uZGFyeSgpLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICApLFxuICAgIGNhbmNlbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICApLFxuICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICB9KTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhZGdlU3R5bGU6IEJhZGdlU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjVweFwiLFxuICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgYmFja2dyb3VuZDogXCIjNWFhZWZmXCIsXG4gICAgdGV4dENvbG9yOiBcIndoaXRlXCIsXG4gICAgdGV4dEZvbnQ6IFwiNDAwIDEzcHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRleHRDb2xvcjogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gIH07XG4gIEBJbnB1dCgpIGNvbnZlcnNhdGlvbnNTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCI5NyVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgdHlwaW5nSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJU19UWVBJTkdcIik7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSU5fQV9USFJFQURcIik7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSByZWNlaXB0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IHt9O1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlU2VudCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VEZWxldGUhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyVW5ibG9ja2VkITogU3Vic2NyaXB0aW9uO1xuXG4gIGNjTWVzc2FnZVJlYWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVGV4dE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZWRpYU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uRm9ybU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc1JlYWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZURlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdTdGFydGVkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ0VuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxSZWplY3RlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsQWNjZXB0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGljb25TdHlsZTogYW55ID0ge1xuICAgIGljb25UaW50OiBcImxpZ2h0Z3JleVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgd2lkdGg6IFwiMjBweFwiLFxuICB9O1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IG5ldyBMaXN0U3R5bGUoe30pO1xuICBtZW51c3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBpY29uVGludDogXCJncmV5XCIsXG4gICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBpY29uQm9yZGVyOiBcIm5vbmVcIixcbiAgICBpY29uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiNzBweFwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMjBweFwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gIH07XG4gIHB1YmxpYyB0eXBpbmdJbmRpY2F0b3IhOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yIHwgbnVsbDtcbiAgcHVibGljIHR5cGluZ0xpc3RlbmVySWQ6IHN0cmluZyA9XG4gICAgXCJjb252ZXJzYXRpb25fX0xJU1RFTkVSXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgaXNEaWFsb2dPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0VtcHR5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiXCIsXG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiLFxuICB9O1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW107XG4gIHB1YmxpYyBzY3JvbGxlZFRvQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjaGVja0l0ZW1DaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29udmVyc2F0aW9uT3B0aW9ucyE6IENvbWV0Q2hhdE9wdGlvbltdO1xuICBwdWJsaWMgc2hvd0NvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblRvQmVEZWxldGVkOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF91c2VyX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBncm91cExpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2hhdGxpc3RfZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwVG9VcGRhdGU6IENvbWV0Q2hhdC5Hcm91cCB8IHt9ID0ge307XG4gIHB1YmxpYyBjb252ZXJzYXRpb25UeXBlPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuICBzYWZlSHRtbCE6IFNhZmVIdG1sO1xuICBlbmFibGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVTdGlja2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVXaGl0ZWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZURvY3VtZW50OiBib29sZWFuID0gZmFsc2U7XG4gIHRocmVhZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZC1hcnJvdy5zdmdcIjtcbiAgcHVibGljIGNvbmZpcm1EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgfTtcbiAgc3VidGl0bGVWYWx1ZSE6IHN0cmluZztcbiAgbW9kYWxTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIyMzBweFwiLFxuICAgIHdpZHRoOiBcIjI3MHB4XCIsXG4gIH07XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzQWN0aXZlOiBib29sZWFuID0gdHJ1ZTtcbiAgY29udGFjdHNOb3RGb3VuZDogYm9vbGVhbiA9IGZhbHNlO1xuICBjaGF0U2VhcmNoITogYm9vbGVhbjtcbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3Q7XG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIHB1YmxpYyBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0aWVzIHdpbGwgY29tZSBmcm9tIFBhcmVudC5cbiAgICovXG4gIEBJbnB1dCgpIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgLy9UbyBiZSBlbmFibGVkIGluIFVNQ1xuICAvLyBASW5wdXQoKSBtZW50aW9uc0ljb25VUkwhOiBzdHJpbmc7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+O1xuXG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIC8qKlxuICAgKiBwYXNzaW5nIHRoaXMgY2FsbGJhY2sgdG8gbWVudUxpc3QgY29tcG9uZW50IG9uIGRlbGV0ZSBjbGlja1xuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIGRlbGV0ZUNvbnZlcnNhdGlvbk9uQ2xpY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29uZmlybWF0aW9uRGlhbG9nKHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQhKTtcbiAgfTtcbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5kZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpO1xuICB9O1xuICBvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50LmRldGFpbC5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KGNvbnZlcnNhdGlvbiwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfVxuICBzZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgIGlmIChcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoZWlnaHQ6IFwiMTJweFwiLFxuICAgICAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0TWVudGlvbkljb25TdHlsZSgpOiBJY29uU3R5bGUge1xuICAvLyAgIHJldHVybiBuZXcgSWNvblN0eWxlKHtcbiAgLy8gICAgIGhlaWdodDogXCIxNnB4XCIsXG4gIC8vICAgICB3aWR0aDogXCIxNnB4XCIsXG4gIC8vICAgICBpY29uVGludDpcbiAgLy8gICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5tZW50aW9uSWNvblRpbnQgPz9cbiAgLy8gICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAvLyAgIH0pO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKClcbiAgICBpZiAoXG4gICAgICBpdGVtIGluc3RhbmNlb2YgQ29tZXRDaGF0LlVzZXJcbiAgICApIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShpdGVtKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSlcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbaXRlbT8uZ2V0U3RhdHVzKCldO1xuICAgICAgZWxzZSByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0dXNDb2xvcltpdGVtPy5nZXRUeXBlKCldXG4gICAgfVxuICB9XG5cbiAgZ2V0RXh0ZW5zaW9uRGF0YShtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgbWVzc2FnZVRleHQ7XG4gICAgLy94c3MgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgeHNzRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInhzcy1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgeHNzRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJzYW5pdGl6ZWRfdGV4dFwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJoYXNYU1NcIikgJiZcbiAgICAgIHhzc0RhdGEuaGFzWFNTID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHhzc0RhdGEuc2FuaXRpemVkX3RleHQ7XG4gICAgfVxuICAgIC8vZGF0YW1hc2tpbmcgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgbWFza2VkRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcImRhdGEtbWFza2luZ1wiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICBtYXNrZWREYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShtYXNrZWREYXRhLCBcImRhdGFcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICBtYXNrZWREYXRhLmRhdGEsXG4gICAgICAgIFwic2Vuc2l0aXZlX2RhdGFcIlxuICAgICAgKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgIG1hc2tlZERhdGEuZGF0YSxcbiAgICAgICAgXCJtZXNzYWdlX21hc2tlZFwiXG4gICAgICApICYmXG4gICAgICBtYXNrZWREYXRhLmRhdGEuc2Vuc2l0aXZlX2RhdGEgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0gbWFza2VkRGF0YS5kYXRhLm1lc3NhZ2VfbWFza2VkO1xuICAgIH1cbiAgICAvL3Byb2Zhbml0eSBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCBwcm9mYW5lRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInByb2Zhbml0eS1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgcHJvZmFuZURhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHByb2ZhbmVEYXRhLCBcInByb2Zhbml0eVwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkocHJvZmFuZURhdGEsIFwibWVzc2FnZV9jbGVhblwiKSAmJlxuICAgICAgcHJvZmFuZURhdGEucHJvZmFuaXR5ID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHByb2ZhbmVEYXRhLm1lc3NhZ2VfY2xlYW47XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlVGV4dCB8fCAobWVzc2FnZU9iamVjdCBhcyBhbnkpLnRleHQ7XG4gIH1cbiAgc2V0U3VidGl0bGUgPSAoY29udmVyc2F0aW9uT2JqZWN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgaWYgKHRoaXMudHlwaW5nSW5kaWNhdG9yKSB7XG4gICAgICBjb25zdCBpc1R5cGluZyA9XG4gICAgICAgIChjb252ZXJzYXRpb25PYmplY3QgYXMgYW55KT8uY29udmVyc2F0aW9uV2l0aD8uZ3VpZCA9PVxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBpZiAoaXNUeXBpbmcpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMudHlwaW5nSW5kaWNhdG9yLmdldFNlbmRlcigpLmdldE5hbWUoKX0gJHt0aGlzLnR5cGluZ0luZGljYXRvclRleHRcbiAgICAgICAgICB9YDtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmplY3QgYXMgYW55KT8uY29udmVyc2F0aW9uV2l0aD8udWlkID09XG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAmJlxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSAhPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGluZ0luZGljYXRvclRleHQ7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzdWJ0aXRsZSA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0LFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLFxuXG4gICAgICB7XG4gICAgICAgIGRpc2FibGVNZW50aW9uczogdGhpcy5kaXNhYmxlTWVudGlvbnMsXG4gICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgbWVudGlvbnNUYXJnZXRFbGVtZW50OiBNZW50aW9uc1RhcmdldEVsZW1lbnQuY29udmVyc2F0aW9uLFxuICAgICAgICB0ZXh0Rm9ybWF0dGVyczogdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgfVxuICAgICk7XG4gICAgbGV0IGljb24gPVxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0Py5nZXRMYXN0TWVzc2FnZSgpPy5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgID8gXCLwn5OeIFwiXG4gICAgICAgIDogXCLwn5O5IFwiO1xuXG4gICAgcmV0dXJuIHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RIdG1sKFxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0Py5nZXRMYXN0TWVzc2FnZSgpPy5nZXRDYXRlZ29yeSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsXG4gICAgICAgID8gaWNvbiArIHN1YnRpdGxlXG4gICAgICAgIDogc3VidGl0bGVcbiAgICApO1xuICB9O1xuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0VW5yZWFkTWVudGlvbnNJY29uU3R5bGUoKSB7XG4gIC8vICAgcmV0dXJuIHtcbiAgLy8gICAgIHBhZGRpbmdSaWdodDogXCIzcHhcIixcbiAgLy8gICB9O1xuICAvLyB9XG5cbiAgY2hlY2tHcm91cFR5cGUoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKFxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICkge1xuICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgIHN3aXRjaCAoZ3JvdXAuZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGltYWdlID0gXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xuICB9XG4gIC8vIGNhbGxiYWNrIGZvciBjb25maXJtRGlhbG9nQ29tcG9uZW50XG4gIG9uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0ID0gKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKFxuICAgICAgY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKClcbiAgICApO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9O1xuICBnZXREYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGVQYXR0ZXJuID8/IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgfVxuICBvcHRpb25zU3R5bGUgPSB7XG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSxcbiAgICBwcml2YXRlIHNhbml0aXplcjogRG9tU2FuaXRpemVyXG4gICkgeyB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIgPVxuICAgICAgICBuZXcgQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgfVxuICAgIHRoaXMuc2V0Q29udmVyc2F0aW9uT3B0aW9ucygpO1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycyh0aGlzLmNvbnZlcnNhdGlvblVwZGF0ZWQpO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIGlmICh0aGlzLnJlcXVlc3RCdWlsZGVyPy5nZXRDb252ZXJzYXRpb25UeXBlKCkpIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uVHlwZSA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuZ2V0Q29udmVyc2F0aW9uVHlwZSgpO1xuICAgIH1cbiAgICB0aGlzLmdldENvbnZlcnNhdGlvbigpO1xuICB9XG4gIC8qKlxuICAqIERldGVybWluZXMgaWYgdGhlIGxhc3QgbWVzc2FnZSBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGUgYmFzZWQgb24gaXRzIGNhdGVnb3J5IGFuZCB0eXBlLlxuICAqXG4gICogQHBhcmFtIG1lc3NhZ2UgLSBUaGUgbGFzdCBtZXNzYWdlIHNlbnQgb3IgcmVjZWl2ZWQgaW4gdGhlIGNvbnZlcnNhdGlvbi5cbiAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBSZXR1cm5zIHRydWUgaWYgdGhlIG1lc3NhZ2Ugc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlLCBmYWxzZSBvdGhlcndpc2UuXG4gICovXG4gIGNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25UeXBlICYmIHRoaXMuY29udmVyc2F0aW9uVHlwZSAhPSBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNraW5nIGlmIHRoZSBtZXNzYWdlIGlzIGEgY3VzdG9tIG1lc3NhZ2VcbiAgICBsZXQgaXNDdXN0b21NZXNzYWdlID0gbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmN1c3RvbVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgcmVwbHkgdG8gYW5vdGhlciBtZXNzYWdlXG4gICAgaWYgKG1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpICYmICFDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25NZXNzYWdlUmVwbGllcygpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpc0N1c3RvbU1lc3NhZ2UpIHtcbiAgICAgIGlmIChtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25NZXNzYWdlUmVwbGllcygpICYmIHRoaXMuc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYW4gYWN0aW9uIG1lc3NhZ2VcbiAgICBpZiAobWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYSBncm91cCBtZW1iZXIgYWN0aW9uXG4gICAgICBpZiAobWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbkdyb3VwQWN0aW9ucygpO1xuICAgICAgfVxuICAgICAgLy8gQnkgZGVmYXVsdCwgYWN0aW9uIG1lc3NhZ2VzIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYSBjYWxsIChlaXRoZXIgYXVkaW8gb3IgdmlkZW8pXG4gICAgaWYgKG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAobWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8gfHxcbiAgICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbykpIHtcbiAgICAgIHJldHVybiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25DYWxsQWN0aXZpdGllcygpO1xuICAgIH1cbiAgICAvLyBCeSBkZWZhdWx0LCBtZXNzYWdlcyBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGVcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBzaG91bGRJbmNyZW1lbnRGb3JDdXN0b21NZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgY29uc3QgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAvLyBDaGVja2luZyBpZiB0aGUgY3VzdG9tIG1lc3NhZ2Ugc2hvdWxkIGluY3JlbWVudCB0aGUgdW5yZWFkIG1lc3NhZ2UgY291bnRlclxuICAgIHJldHVybiBtZXNzYWdlLndpbGxVcGRhdGVDb252ZXJzYXRpb24oKVxuICAgICAgfHwgKG1ldGFkYXRhICYmIG1ldGFkYXRhLmhhc093blByb3BlcnR5KFwiaW5jcmVtZW50VW5yZWFkQ291bnRcIikgJiYgbWV0YWRhdGEuaW5jcmVtZW50VW5yZWFkQ291bnQpIHx8IENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbkN1c3RvbU1lc3NhZ2VzKCk7XG4gIH1cbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3Q29udmVyc2F0aW9ucygpO1xuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpICYmIHRoaXMuY2hlY2tJZkxhc3RNZXNzYWdlU2hvdWxkVXBkYXRlKGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpKSkge1xuICAgICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25JZCgpID09IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0LnNwbGljZShpbmRleCwgMSwgY29udmVyc2F0aW9uKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmdyb3VwISk7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRMYXN0TWVzc2FnZShpdGVtLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBpdGVtLnVzZXJBZGRlZEluITtcbiAgICAgICAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbltdID0gaXRlbS5tZXNzYWdlcyE7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS51c2VyQWRkZWRJbiEpO1xuICAgICAgICAgIGNvbnZlcnNhdGlvbj8uc2V0Q29udmVyc2F0aW9uV2l0aChncm91cCk7XG4gICAgICAgICAgY29udmVyc2F0aW9uPy5zZXRMYXN0TWVzc2FnZShhY3Rpb25NZXNzYWdlW2FjdGlvbk1lc3NhZ2U/Lmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24hKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID1cbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbiA9IHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0ua2lja2VkRnJvbSEpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBEZWxldGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cERlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbSk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICAgIChjPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkgPT1cbiAgICAgICAgICAgICAgaXRlbS5sZWZ0R3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID49IDApIHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbVVzZXIoaXRlbSk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbiAmJiAhdGhpcy5yZXF1ZXN0QnVpbGRlcj8uaXNJbmNsdWRlQmxvY2tlZFVzZXJzKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjVXNlclVuYmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tVXNlcihpdGVtKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uICYmIHRoaXMucmVxdWVzdEJ1aWxkZXI/LmlzSW5jbHVkZUJsb2NrZWRVc2VycygpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIoaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG9iamVjdD8ubWVzc2FnZT8uZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqZWN0Lm1lc3NhZ2UhO1xuICAgICAgICAgIGlmIChvYmplY3Quc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50LnN1YnNjcmliZShcbiAgICAgIChvYmo6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqLm1lc3NhZ2UhO1xuICAgICAgICBpZiAob2JqLnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZU9iamVjdCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlT2JqZWN0LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3RcbiAgICAgICAgICApLnRoZW4oKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2VPYmplY3QgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy5yZXNldFVucmVhZENvdW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAoY2FsbCAmJiBPYmplY3Qua2V5cyhjYWxsKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEFjY2VwdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJVbmJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIGdldENvbnZlcnNhdGlvbkZyb21Vc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgKGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSA9PVxuICAgICAgICB1c2VyLmdldFVpZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVyc2F0aW9uTGlzdFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldENvbnZlcnNhdGlvbkZyb21Hcm91cChcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgKGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09XG4gICAgICAgIGdyb3VwLmdldEd1aWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2U6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGNoYW5nZVtcImFjdGl2ZUNvbnZlcnNhdGlvblwiXSkge1xuICAgICAgICB0aGlzLnJlc2V0VW5yZWFkQ291bnQoKTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgaWYgKGNoYW5nZVtcImNvbnZlcnNhdGlvbnNTdHlsZVwiXSkge1xuICAgICAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogV2hlbiB1c2VyIHNlbmRzIG1lc3NhZ2UgY29udmVyc2F0aW9uTGlzdCBpcyB1cGRhdGVkIHdpdGggbGF0ZXN0IG1lc3NhZ2VcbiAgICAgICAqL1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLy8gZ2V0dGluZyBkZWZhdWx0IGNvbnZlcnNhdGlvbiBvcHRpb24gYW5kIGFkZGluZyBjYWxsYmFjayBpbiBpdFxuICBzZXRDb252ZXJzYXRpb25PcHRpb25zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zID0gQ29udmVyc2F0aW9uVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0T3B0aW9uKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICFlbGVtZW50Lm9uQ2xpY2sgJiZcbiAgICAgICAgZWxlbWVudC5pZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Db252ZXJzYXRpb25PcHRpb25zLmRlbGV0ZVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uT25DbGljaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gcmVzZXQgdW5yZWFkIGNvdW50XG4gIG9uQ2xpY2soY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soY29udmVyc2F0aW9uKTtcbiAgICB9XG4gIH1cbiAgLy8gc2V0IHVucmVhZCBjb3VudFxuICByZXNldFVucmVhZENvdW50KCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbikge1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo/LmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAvL25ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpPy5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHNldHMgcHJvcGVydHkgZnJvbSB0aGVtZSB0byBzdHlsZSBvYmplY3RcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRCYWRnZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRDb25maXJtRGlhbG9nU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0UmVjZWlwdFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgfTtcbiAgICB0aGlzLmljb25TdHlsZS5pY29uVGludCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRDb252ZXJzYXRpb25zU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0gbmV3IENvbnZlcnNhdGlvbnNTdHlsZSh7XG4gICAgICBsYXN0TWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGxhc3RNZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIHRocmVhZEluZGljYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cbiAgc2V0UmVjZWlwdFN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHRoaXMucmVjZWlwdFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgc2V0QmFkZ2VTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYWRnZVN0eWxlID0gbmV3IEJhZGdlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGhlaWdodDogXCIxNnB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuYmFkZ2VTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmJhZGdlU3R5bGUgfTtcbiAgfVxuICBzZXRDb25maXJtRGlhbG9nU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUsXG4gICAgfTtcbiAgfVxuICAvLyBjaGVja2luZyBpZiB1c2VyIGhhcyBoaXMgb3duIGNvbmZpZ3VyYXRpb24gZWxzZSB3aWxsIHVzZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb25cbiAgLyoqXG4gICAqIEBwYXJhbSAge09iamVjdD17fX0gY29uZmlnXG4gICAqIEBwYXJhbSAge09iamVjdH0gZGVmYXVsdENvbmZpZz9cbiAgICogQHJldHVybnMgZGVmYXVsdENvbmZpZ1xuICAgKi9cbiAgLy8gY2FsbGluZyBzdWJ0aXRsZSBjYWxsYmFjayBmcm9tIGNvbmZpZ3VyYXRpb25zXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBjb3ZlcnNhdGlvbiBiYXNlZCBvbiB0aGUgY29udmVyc2F0aW9uUmVxdWVzdCBjb25maWdcbiAgICovXG4gIGZldGNoTmV4dENvbnZlcnNhdGlvbigpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgJiZcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBtZXNzYWdlPy5nZXRJZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYXR0YWNoZXMgTGlzdGVuZXJzIGZvciB1c2VyIGFjdGl2aXR5ICwgZ3JvdXAgYWN0aXZpdGllcyBhbmQgY2FsbGluZ1xuICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIGF0dGFjaExpc3RlbmVycyhjYWxsYmFjazogYW55KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSkge1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogb2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lLFxuICAgICAgICAgICAgICAgIG9ubGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9mZmxpbmUsXG4gICAgICAgICAgICAgICAgb2ZmbGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuZ3JvdXBMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAgbmV3U2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgb2xkU2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAga2lja2VkVXNlcjogYW55LFxuICAgICAgICAgICAgICBraWNrZWRCeTogYW55LFxuICAgICAgICAgICAgICBraWNrZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBraWNrZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShraWNrZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgYmFubmVkVXNlcjogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRCeTogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBiYW5uZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShiYW5uZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICB1c2VyQWRkZWQ6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkQnk6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW46IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogYW55LCBsZWF2aW5nVXNlcjogYW55LCBncm91cDogYW55KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBqb2luZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICAvLyBTREsgbGlzdGVuZXJzXG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAodGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgdGV4dE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVkaWFNZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgbWVkaWFNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBGb3JtTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGZvcm1NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoZm9ybU1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY2FyZE1lc3NhZ2U6IENhcmRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY2FyZE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSkpIHtcbiAgICAgICAgICAgIHRoaXMubWFya0FzUmVhZChtZXNzYWdlUmVjZWlwdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgICAgKGRlbGV0ZWRNZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBkZWxldGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZUVkaXRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgICAgKGVkaXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9FRElURUQsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZWRpdGVkTWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZXNEZWxpdmVyZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVJlY2VpcHQgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0Py5nZXRSZWNlaXZlclR5cGUoKSkpIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWxpdmVyZWRNZXNzYWdlKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdTdGFydGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZykge1xuICAgICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IHR5cGluZ0luZGljYXRvcjtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZldGNoTmV3Q29udmVyc2F0aW9ucygpIHtcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKTtcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlcj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW107XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oU3RhdGVzLmxvYWRlZCk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoZ3JvdXApXG4gICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbilcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGZXRjaGVzIENvbnZlcnNhdGlvbnMgRGV0YWlscyB3aXRoIGFsbCB0aGUgdXNlcnNcbiAgICovXG4gIGdldENvbnZlcnNhdGlvbiA9IChzdGF0ZXM6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciAmJlxuICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uICYmXG4gICAgICAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlcztcbiAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgdGhpcy5mZXRjaE5leHRDb252ZXJzYXRpb24oKVxuICAgICAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb252ZXJzYXRpb24uc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlcyA9PSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgICAuLi5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0Lmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMuZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBpc1JlY2VpcHREaXNhYmxlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBhbnkgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpO1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlUmVjZWlwdCAmJlxuICAgICAgbWVzc2FnZSAmJlxuICAgICAgIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAoIXRoaXMudHlwaW5nSW5kaWNhdG9yIHx8XG4gICAgICAgIChpdGVtPy51aWQgIT0gdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpICYmXG4gICAgICAgICAgaXRlbT8uZ3VpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udmVyc2F0aW9uIGxpc3QncyBsYXN0IG1lc3NhZ2UgLCBiYWRnZUNvdW50ICwgdXNlciBwcmVzZW5jZSBiYXNlZCBvbiBhY3Rpdml0aWVzIHByb3BhZ2F0ZWQgYnkgbGlzdGVuZXJzXG4gICAqL1xuICBjb252ZXJzYXRpb25VcGRhdGVkID0gKFxuICAgIGtleTogYW55LFxuICAgIGl0ZW06IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG9wdGlvbnMgPSBudWxsXG4gICkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRTpcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQ6XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFya01lc3NhZ2VBc0RlbGl2ZXJlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAvL2lmIGNoYXQgd2luZG93IGlzIG5vdCBvcGVuLCBtYXJrIG1lc3NhZ2UgYXMgZGVsaXZlcmVkXG4gICAgaWYgKFxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgKSB7XG4gICAgICBpZiAoXG4gICAgICAgICghdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gfHxcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICAgKT8uZ2V0VWlkKCkgIT09IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSkgJiZcbiAgICAgICAgIW1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKVxuICAgICAgKSB7XG4gICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgKCF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fFxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKT8uZ2V0R3VpZCgpICE9PSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCkpICYmXG4gICAgICAgICFtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZGVsaXZlcmVkQXRcIilcbiAgICAgICkge1xuICAgICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gcmVhZE1lc3NhZ2VcbiAgICovXG4gIGdldFVpbnggPSAoKSA9PiB7XG4gICAgcmV0dXJuIFN0cmluZyhNYXRoLnJvdW5kKCtuZXcgRGF0ZSgpIC8gMTAwMCkpO1xuICB9O1xuICBtYXJrQXNSZWFkKHJlYWRNZXNzYWdlOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpIHtcbiAgICBsZXQgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gWy4uLnRoaXMuY29udmVyc2F0aW9uTGlzdF07XG4gICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICkuZ2V0UmVjZWl2ZXJJZCgpID09IHJlYWRNZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpXG4gICAgKTtcbiAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmplY3QhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbXG4gICAgICAgICAgICBjb252ZXJzYXRpb25LZXlcbiAgICAgICAgICBdLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuZ2V0UmVhZEF0KClcbiAgICAgICkge1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QgPSBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIChcbiAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXRSZWFkQXQocmVhZE1lc3NhZ2UuZ2V0UmVhZEF0KCkpO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3Quc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAoXG4gICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqZWN0KTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIERldGFpbCB3aGVuIHVzZXIgY29tZXMgb25saW5lL29mZmxpbmVcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ8Q29tZXRDaGF0Lkdyb3VwfG51bGx9IHVzZXJcbiAgICovXG4gIHVwZGF0ZVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAgfCBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vd2hlbiB1c2VyIHVwZGF0ZXNcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbmxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFtcbiAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgXTtcbiAgICAgIC8vR2V0cyB0aGUgaW5kZXggb2YgdXNlciB3aGljaCBjb21lcyBvZmZsaW5lL29ubGluZVxuICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT09XG4gICAgICAgICAgKHVzZXIgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbldpdGhPYmo6IENvbWV0Q2hhdC5Vc2VyID1cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoT2JqLnNldFN0YXR1cygodXNlciBhcyBDb21ldENoYXQuVXNlcikuZ2V0U3RhdHVzKCkpO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0Q29udmVyc2F0aW9uV2l0aChjb252ZXJzYXRpb25XaXRoT2JqKTtcbiAgICAgICAgKG5ld0NvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbmxpc3Q7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgdGhlIGxhc3QgbWVzc2FnZVxuICAgKiBAcGFyYW0gY29udmVyc2F0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0aW9uXG4gICAqL1xuICBtYWtlTGFzdE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IHt9ID0ge31cbiAgKSB7XG4gICAgY29uc3QgbmV3TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgcmV0dXJuIG5ld01lc3NhZ2U7XG4gIH1cbiAgdXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmIChtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG5cbiAgICAgIGNvbnN0IGlzU2FtZUdyb3VwID0gKG1lc3NhZ2UuZ2V0UmVjZWl2ZXIoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PT1cbiAgICAgICAgKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCk7XG5cbiAgICAgIGlmIChpc1NhbWVHcm91cCkge1xuICAgICAgICBsZXQgdXBkYXRlZEdyb3VwID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXA7XG4gICAgICAgIHVwZGF0ZWRHcm91cC5zZXRNZW1iZXJzQ291bnQoKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRNZW1iZXJzQ291bnQoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbi5zZXRDb252ZXJzYXRpb25XaXRoKHVwZGF0ZWRHcm91cCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBVcGRhdGVzIENvbnZlcnNhdGlvbnMgYXMgVGV4dC9DdXN0b20gTWVzc2FnZXMgYXJlIHJlY2VpdmVkXG4gICAqIEBwYXJhbVxuICAgKlxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtib29sZWFufSBub3RpZmljYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbihcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgbm90aWZpY2F0aW9uOiBib29sZWFuID0gdHJ1ZVxuICApIHtcbiAgICBsZXQgbWV0YWRhdGE6IGFueTtcbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgICBtZXRhZGF0YSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShtZXNzYWdlKSkge1xuICAgICAgICB0aGlzLm1ha2VDb252ZXJzYXRpb24obWVzc2FnZSlcbiAgICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGlzQ3VzdG9tTWVzc2FnZTogYm9vbGVhbiA9IG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uS2V5O1xuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uTGlzdCA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgLy8gaWYgc2VuZGVyIGlzIG5vdCBsb2dnZWQgaW4gdXNlciB0aGVuICBpbmNyZW1lbnQgY291bnRcbiAgICAgICAgICAgICAgbGV0IHVucmVhZE1lc3NhZ2VDb3VudCA9XG4gICAgICAgICAgICAgICAgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpIHx8XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkpXG4gICAgICAgICAgICAgICAgICA/IHRoaXMubWFrZVVucmVhZE1lc3NhZ2VDb3VudChjb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgICAgICA6IHRoaXMubWFrZVVucmVhZE1lc3NhZ2VDb3VudChjb252ZXJzYXRpb25PYmopIC0gMTtcbiAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShcbiAgICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9ialxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5BY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlLCBuZXdDb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKGxhc3RNZXNzYWdlT2JqKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudCh1bnJlYWRNZXNzYWdlQ291bnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZU9iai5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBtZW50aW9uZWRVc2VycyA9IGxhc3RNZXNzYWdlT2JqLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgZm9yIChcbiAgICAgICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpKytcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGltZXNMb2dnZWRJblVzZXJJc01lbnRpb25lZCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QudW5zaGlmdChuZXdDb252ZXJzYXRpb25PYmopO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbmV3Q29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24gJiZcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgaW5jcmVtZW50Q291bnQgPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA/IDEgOiAwXG4gICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZU9iaiA9IHRoaXMubWFrZUxhc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouc2V0TGFzdE1lc3NhZ2UobGFzdE1lc3NhZ2VPYmopO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5BY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlLCBjb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudChpbmNyZW1lbnRDb3VudCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnVuc2hpZnQoY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gY29udmVyc2F0aW9uTGlzdDtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSBjb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoYy5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBOdW1iZXIobWVzc2FnZVJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpXG4gICAgKTtcbiAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgY29udmVyc2F0aW9uT2JqID0gY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICkge1xuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0RGVsaXZlcmVkQXQoTnVtYmVyKHRoaXMuZ2V0VWlueCgpKSk7XG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBjb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgVGhlIENvdW50IG9mIFVucmVhZCBNZXNzYWdlc1xuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGNvbnZlcnNhdGlvblxuICAgKiBAcGFyYW0gIHthbnl9IG9wZXJhdG9yXG4gICAqL1xuICBtYWtlVW5yZWFkTWVzc2FnZUNvdW50KFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBvcGVyYXRvcjogYW55ID0gbnVsbFxuICApIHtcbiAgICBpZiAoT2JqZWN0LmtleXMoY29udmVyc2F0aW9uKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBsZXQgdW5yZWFkTWVzc2FnZUNvdW50OiBudW1iZXIgPSBjb252ZXJzYXRpb24uZ2V0VW5yZWFkTWVzc2FnZUNvdW50KCk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICkge1xuICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ICs9IDE7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKS5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCkgPT09XG4gICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpKSB8fFxuICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmhhc093blByb3BlcnR5KFwidWlkXCIpICYmXG4gICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkuaGFzT3duUHJvcGVydHkoXCJ1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpID09PVxuICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3BlcmF0b3IgJiYgb3BlcmF0b3IgPT09IFwiZGVjcmVtZW50XCIpIHtcbiAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gdW5yZWFkTWVzc2FnZUNvdW50ID8gdW5yZWFkTWVzc2FnZUNvdW50IC0gMSA6IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSB1bnJlYWRNZXNzYWdlQ291bnQgKyAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5yZWFkTWVzc2FnZUNvdW50O1xuICB9XG4gIC8qKlxuICAgKiBDaGFuZ2VzIGRldGFpbCBvZiBjb252ZXJzYXRpb25zXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT0gbWVzc2FnZT8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgY29udmVyc2F0aW9uS2V5OiBjb252ZXJzYXRpb25LZXksXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqOiBjb252ZXJzYXRpb24sXG4gICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIuZ2V0Q29udmVyc2F0aW9uRnJvbU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGluc3RhbmNlb2YgQ29tZXRDaGF0Lkdyb3VwICYmXG4gICAgICAgICAgICAgICEoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICAgKS5nZXRTY29wZSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgICAgICkuc2V0SGFzSm9pbmVkKHRydWUpO1xuICAgICAgICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLnNldFNjb3BlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25LZXk6IC0xLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmo6IGNvbnZlcnNhdGlvbixcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBDb252ZXJzYXRpb24gVmlldyB3aGVuIG1lc3NhZ2UgaXMgZWRpdGVkIG9yIGRlbGV0ZWRcbiAgICovXG4gIGNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICAgICAgICAgIGlmIChsYXN0TWVzc2FnZU9iai5nZXRJZCgpID09PSBtZXNzYWdlLmdldElkKCkpIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIElmIFVzZXIgc2Nyb2xscyB0byB0aGUgYm90dG9tIG9mIHRoZSBjdXJyZW50IENvbnZlcnNhdGlvbiBsaXN0IHRoYW4gZmV0Y2ggbmV4dCBpdGVtcyBvZiB0aGUgQ29udmVyc2F0aW9uIGxpc3QgYW5kIGFwcGVuZFxuICAgKiBAcGFyYW0gRXZlbnRcbiAgICovXG4gIC8qKlxuICAgKiBQbGF5cyBBdWRpbyBXaGVuIE1lc3NhZ2UgaXMgUmVjZWl2ZWRcbiAgICovXG4gIHBsYXlBdWRpbygpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIGlmICh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheSh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZUZyb21PdGhlclxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLypcbiAgICogVXBkYXRlcyB0aGUgY29udmVzYXRpb24gbGlzdCB3aGVuIGRlbGV0ZWQuXG4gICAqIEFkZGluZyBDb252ZXJzYXRpb24gT2JqZWN0IHRvIENvbWV0Y2hhdFNlcnZpY2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCkge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudD8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogc2hvd2luZyBkaWFsb2cgZm9yIGNvbmZpcm0gYW5kIGNhbmNlbFxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHNob3dDb25maXJtYXRpb25EaWFsb2cgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBjb252ZXJzYXRpb247XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbk9wdGlvbkNsaWNrKGV2ZW50OiBhbnksIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBvcHRpb246IENvbWV0Q2hhdE9wdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmRhdGE7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICBpZiAob3B0aW9uKSB7XG4gICAgICBvcHRpb24ub25DbGljayEoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIHNob3cgY29uZmlybSBkaWFsb2cgc2NyZWVuXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdG9uXG4gICAqL1xuICAvLyBjaGVjayBpcyB0aGVyZSBpcyBhbnkgYWN0aXZlIGNvbnZlcnNhdGlvbiBhbmQgbWFyayBpdCBhcyBhY3RpdmVcbiAgZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiBhcyBhbnkpPy5jb252ZXJzYXRpb25JZCA9PVxuICAgICAgICAoY29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBoYW5kbGUgY29uZmlybSBkaWFsb2cgcmVzcG9uc2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB2YWx1ZVxuICAgKi9cbiAgLy8gY2FsbGluZyBjb21ldGNoYXQuZGVsZXRlQ29udmVyc2F0aW9uIG1ldGhvZFxuICBkZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoO1xuICAgICAgbGV0IGNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICAgIGlmIChcbiAgICAgICAgY29udmVyc2F0aW9uVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICApIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuZGVsZXRlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbldpdGgsIGNvbnZlcnNhdGlvblR5cGUpLnRoZW4oXG4gICAgICAgIChkZWxldGVkQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLmNjQ29udmVyc2F0aW9uRGVsZXRlZC5uZXh0KFxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCFcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdCh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKTtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvLyBleHBvc2VkIG1ldGhvZHMgdG8gdXNlcnMuXG4gIHVwZGF0ZUxhc3RNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICB9XG4gIHJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uKTtcbiAgfVxuICBzdHlsZXM6IGFueSA9IHtcbiAgICB3cmFwcGVyU3R5bGU6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuaGVpZ2h0LFxuICAgICAgICB3aWR0aDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUud2lkdGgsXG4gICAgICAgIGJvcmRlcjpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5ib3JkZXIgfHxcbiAgICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG4gIHN1YnRpdGxlU3R5bGUgPSAoY29udmVyc2F0aW9uOiBhbnkpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnR5cGluZ0luZGljYXRvciAmJlxuICAgICAgKCh0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/LnVpZCkgfHxcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpID09XG4gICAgICAgIGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25XaXRoPy5ndWlkKVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudHlwaW5nSW5kaWN0b3JUZXh0Q29sb3IsXG4gICAgICAgIGNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sYXN0TWVzc2FnZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGl0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc1wiIFtuZ1N0eWxlXT1cInN0eWxlcy53cmFwcGVyU3R5bGUoKVwiPlxuICA8Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cImlzRGlhbG9nT3BlblwiPlxuICAgIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cImNvbmZpcm1EaWFsb2dUaXRsZVwiXG4gICAgICBbbWVzc2FnZVRleHRdPVwiY29uZmlybURpYWxvZ01lc3NhZ2VcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxCdXR0b25UZXh0XCJcbiAgICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJjb25maXJtQnV0dG9uVGV4dFwiXG4gICAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIlxuICAgICAgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlXCI+XG4gICAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG4gIDwvY29tZXRjaGF0LWJhY2tkcm9wPlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbc3RhdGVdPVwic3RhdGVcIiBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCJcbiAgICBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJnZXRDb252ZXJzYXRpb25cIlxuICAgIFtsaXN0XT1cImNvbnZlcnNhdGlvbkxpc3RcIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIj48L2NvbWV0Y2hhdC1saXN0PlxuPC9kaXY+XG48bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1jb252ZXJzYXRpb24+XG4gIDxjb21ldGNoYXQtbGlzdC1pdGVtIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInNldFN0YXR1c0luZGljYXRvclN0eWxlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtpZF09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbklkXCJcbiAgICBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbilcIlxuICAgIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soY29udmVyc2F0aW9uKVwiXG4gICAgW3RpdGxlXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8ubmFtZVwiXG4gICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoY29udmVyc2F0aW9uKVwiXG4gICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICBbYXZhdGFyVVJMXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8uYXZhdGFyIHx8IGNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8uaWNvblwiXG4gICAgW2F2YXRhck5hbWVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCI+XG4gICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBjb252ZXJzYXRpb25TdWJ0aXRsZVwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiBjb252ZXJzYXRpb24gfVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPG5nLXRlbXBsYXRlICNjb252ZXJzYXRpb25TdWJ0aXRsZT5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3N1YnRpdGxlLXZpZXcgXCIgc2xvdD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGhyZWFkdmlld1wiXG4gICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlPy5wYXJlbnRNZXNzYWdlSWRcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cIml0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSgpXCJcbiAgICAgICAgICAgIFt0ZXh0XT1cInRocmVhZEluZGljYXRvclRleHRcIj4gPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1pY29uIFtVUkxdPVwidGhyZWFkSWNvblVSTFwiXG4gICAgICAgICAgICBbaWNvblN0eWxlXT1cImljb25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zdWJ0aXRsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19yZWFkcmVjZWlwdFwiXG4gICAgICAgICAgICAqbmdJZj1cImlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uKVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cInJlY2VpcHRTdHlsZVwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCIgW2RlbGl2ZXJlZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtyZWFkSWNvbl09XCJyZWFkSWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoY29udmVyc2F0aW9uKVwiIGNsYXNzPVwiY2Mtc3VidGl0bGVfX3RleHRcIlxuICAgICAgICAgICAgW2lubmVySFRNTF09XCJzZXRTdWJ0aXRsZShjb252ZXJzYXRpb24pXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxkaXYgc2xvdD1cIm1lbnVWaWV3XCIgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19vcHRpb25zdmlld1wiXG4gICAgICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgPGRpdiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50LGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVzdHlsZVwiPlxuXG4gICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFvcHRpb25zICYmIGNvbnZlcnNhdGlvbk9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwiY29udmVyc2F0aW9uT3B0aW9uc1wiXG4gICAgICAgICAgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudCxjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICBbbWVudUxpc3RTdHlsZV09XCJtZW51c3R5bGVcIj5cblxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGFpbC12aWV3XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiXG4gICAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5ub25lICYmIGNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2VcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZGF0ZVN0eWxlXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwiY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZT8uc2VudEF0XCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cImdldERhdGUoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fYmFkZ2VcIj5cbiAgICAgICAgICA8IS0tIDxjb21ldGNoYXQtaWNvbiAqbmdJZj1cImNvbnZlcnNhdGlvbj8uZ2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KClcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRNZW50aW9uc0ljb25TdHlsZSgpXCIgW2ljb25TdHlsZV09Z2V0TWVudGlvbkljb25TdHlsZSgpIFtVUkxdPVwibWVudGlvbnNJY29uVVJMXCI+PC9jb21ldGNoYXQtaWNvbj4gLS0+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1iYWRnZSBbY291bnRdPVwiY29udmVyc2F0aW9uPy51bnJlYWRNZXNzYWdlQ291bnRcIlxuICAgICAgICAgICAgW2JhZGdlU3R5bGVdPVwiYmFkZ2VTdHlsZVwiPjwvY29tZXRjaGF0LWJhZGdlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3NlbGVjdGlvbi12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cbiAgICA8ZGl2ICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uXG4gICAgICAgIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWNoZWNrYm94XG4gICAgICAgIChjYy1jaGVja2JveC1jaGFuZ2VkKT1cIm9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uLCRldmVudClcIj48L2NvbWV0Y2hhdC1jaGVja2JveD5cbiAgICA8L2Rpdj5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvbmctdGVtcGxhdGU+XG4iXX0=