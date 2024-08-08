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
        this.getStatusIndicatorStyle = (conversation) => {
            const convWith = conversation.getConversationWith();
            if (convWith instanceof CometChat.User) {
                let userStatusVisibility = new MessageUtils().getUserStatusVisibility(convWith);
                if (!this.disableUsersPresence && !userStatusVisibility) {
                    return this.statusIndicatorStyle;
                }
                return null;
            }
            else if (conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
                return {
                    height: "12px",
                    width: "12px",
                    borderRadius: "16px",
                };
            }
            else {
                return null;
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
            const isGroupConversation = this.activeConversation?.getConversationType() ==
                CometChatUIKitConstants.MessageReceiverType.group;
            const isUserConversation = this.activeConversation?.getConversationType() ==
                CometChatUIKitConstants.MessageReceiverType.user;
            const isSameGroup = this.activeConversation?.getConversationWith() instanceof CometChat.Group && this.activeConversation?.getConversationWith()?.getGuid() === message?.getReceiverId();
            const isSameUser = this.activeConversation?.getConversationWith() instanceof CometChat.User && this.activeConversation?.getConversationWith()?.getUid() === message?.getSender()?.getUid();
            const shouldMarkAsDelivered = !this.activeConversation ||
                (isGroupConversation && isSameGroup) ||
                (isUserConversation && isSameUser);
            if (shouldMarkAsDelivered && !message.hasOwnProperty("deliveredAt")) {
                CometChat.markAsDelivered(message);
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
                if (!this.disableReceipt && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user && (!this.conversationType || this.conversationType == messageReceipt.getReceiverType())) {
                    this.markAsRead(messageReceipt);
                }
            });
            this.onMessagesReadByAll = CometChatMessageEvents.onMessagesReadByAll.subscribe((messageReceipt) => {
                if (!this.disableReceipt && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.group && (!this.conversationType || this.conversationType == messageReceipt.getReceiverType())) {
                    this.markAsRead(messageReceipt);
                }
            });
            this.onMessagesDeliveredToAll = CometChatMessageEvents.onMessagesDeliveredToAll.subscribe((messageReceipt) => {
                if (!this.disableReceipt && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.group && (!this.conversationType || this.conversationType == messageReceipt?.getReceiverType())) {
                    this.updateDeliveredMessage(messageReceipt);
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
                    if (!this.disableReceipt && messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user && (!this.conversationType || this.conversationType == messageReceipt?.getReceiverType())) {
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
            this.onMessagesDeliveredToAll?.unsubscribe();
            this.onMessagesReadByAll?.unsubscribe();
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
        const conversationKey = conversationlist.findIndex((conversationObj) => conversationObj.getLastMessage().getId() == Number(readMessage.getMessageId()) && conversationObj.getLastMessage().getSender().getUid() == this.loggedInUser?.getUid());
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
        let conversationKey = conversationList.findIndex((c) => c.getLastMessage().getId() == Number(messageReceipt.getMessageId()) && c.getLastMessage().getSender().getUid() == this.loggedInUser?.getUid());
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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"getStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"getStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1oscUJBQXFCLEVBQ3JCLGFBQWEsRUFFYixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFFZCxVQUFVLEVBQ1YsUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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aUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBR0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyw2QkFBNkI7c0JBQXJDLEtBQUs7Z0JBc0JHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsVUFBVTtzQkFBbEIsS0FBSztnQkFRRyxTQUFTO3NCQUFqQixLQUFLO2dCQUlHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFNRyxhQUFhO3NCQUFyQixLQUFLO2dCQUlHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFLRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFvSEcsWUFBWTtzQkFBcEIsS0FBSztnQkFHRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5cbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBCYWRnZVN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgSWNvblN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBCYXNlU3R5bGUsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBDb252ZXJzYXRpb25VdGlscyxcbiAgQ29udmVyc2F0aW9uc1N0eWxlLFxuICBMaXN0U3R5bGUsXG4gIE1lc3NhZ2VSZWNlaXB0VXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQ2FyZE1lc3NhZ2UsXG4gIENvbWV0Q2hhdENhbGxFdmVudHMsXG4gIENvbWV0Q2hhdENvbnZlcnNhdGlvbkV2ZW50cyxcbiAgQ29tZXRDaGF0R3JvdXBFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFVzZXJFdmVudHMsXG4gIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSxcbiAgRGF0ZVBhdHRlcm5zLFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIE1lbnRpb25zVGFyZ2V0RWxlbWVudCxcbiAgTWVzc2FnZVN0YXR1cyxcbiAgU2NoZWR1bGVyTWVzc2FnZSxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgU3RhdGVzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgVXNlclByZXNlbmNlUGxhY2VtZW50LFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgSG9zdEJpbmRpbmcsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgRG9tU2FuaXRpemVyLCBTYWZlSHRtbCB9IGZyb20gXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgTWVzc2FnZVV0aWxzIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9NZXNzYWdlVXRpbHNcIjtcblxuLyoqXG4gKlxuICogQ29tZXRDaGF0Q29udmVyc2F0aW9uIGlzIGEgd3JhcHBlciBjb21wb25lbnQgY29uc2lzdHMgb2YgQ29tZXRDaGF0TGlzdEJhc2VDb21wb25lbnQgYW5kIENvbnZlcnNhdGlvbkxpc3RDb21wb25lbnQuXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDb252ZXJzYXRpb25zQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0aWVzIHdpbGwgY29tZSBmcm9tIFBhcmVudC5cbiAgICovXG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNIQVRTXCIpOyAvL1RpdGxlIG9mIHRoZSBjb21wb25lbnRcbiAgQElucHV0KCkgb3B0aW9ucyE6XG4gICAgfCAoKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4gQ29tZXRDaGF0T3B0aW9uW10pXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZUhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7IC8vIHBsYWNlaG9sZGVyIHRleHQgb2Ygc2VhcmNoIGlucHV0XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWNlaXB0OiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGVsaXZlcmVkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1kZWxpdmVyZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHJlYWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXJlYWQuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FybmluZy1zbWFsbC5zdmdcIjtcbiAgQElucHV0KCkgZGF0ZVBhdHRlcm46IERhdGVQYXR0ZXJucyA9IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgQElucHV0KCkgb25FcnJvcjogKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB2b2lkID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgc2VudEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2Utc2VudC5zdmdcIjtcbiAgQElucHV0KCkgcHJpdmF0ZUdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvUHJpdmF0ZS5zdmdcIjtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy43IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAncGFzc3dvcmRHcm91cEljb24nLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgICovXG4gIEBJbnB1dCgpIHByb3RlY3RlZEdyb3VwSWNvbjogc3RyaW5nID0gXCJhc3NldHMvTG9ja2VkLnN2Z1wiO1xuICBASW5wdXQoKSBwYXNzd29yZEdyb3VwSWNvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2VzOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBhY3RpdmVDb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gbnVsbDsgLy9zZWxlY3RlZCBjb252ZXJzYXRpb25cbiAgQElucHV0KCkgc2VhcmNoSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc2VhcmNoLnN2Z1wiOyAvL2ltYWdlIFVSTCBvZiB0aGUgc2VhcmNoIGljb25cbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IHRydWU7IC8vc3dpdGNoIG9uL2ZmIHNlYXJjaCBpbnB1dFxuICBASW5wdXQoKSBjb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyO1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG9uU2VsZWN0ITogKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBzZWxlY3RlZDogYm9vbGVhblxuICApID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGxvYWRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TcGlubmVyLnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGxvYWRpbmdTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19DSEFUU19GT1VORFwiKTtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBASW5wdXQoKSB0aXRsZUFsaWdubWVudDogVGl0bGVBbGlnbm1lbnQgPSBUaXRsZUFsaWdubWVudC5sZWZ0O1xuXG4gIEBJbnB1dCgpIGxpc3RJdGVtVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIG1lbnUhOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBoaWRlU2VwYXJhdG9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTtcbiAgQElucHV0KCkgaGlkZUVycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdGlvbk1vZGU6IFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlLm5vbmU7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGNvbmZpcm1EaWFsb2dUaXRsZSA9IGxvY2FsaXplKFwiREVMRVRFX0NPTlZFUlNBVElPTlwiKTtcbiAgQElucHV0KCkgY29uZmlybUJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiREVMRVRFXCIpO1xuICBASW5wdXQoKSBjYW5jZWxCdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNBTkNFTFwiKTtcbiAgQElucHV0KCkgY29uZmlybURpYWxvZ01lc3NhZ2U6IHN0cmluZyA9IGxvY2FsaXplKFxuICAgIFwiV09VTERfX1lPVV9MSUtFX1RPX0RFTEVURV9USElTX0NPTlZFUlNBVElPTlwiXG4gICk7XG4gIEBJbnB1dCgpIG9uSXRlbUNsaWNrITogKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4gdm9pZDtcbiAgQElucHV0KCkgZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOlxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJsaWdodFwiKSxcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgKSxcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgKSxcbiAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICBtZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgfSk7XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBiYWRnZVN0eWxlOiBCYWRnZVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI1cHhcIixcbiAgICBoZWlnaHQ6IFwiMTVweFwiLFxuICAgIGJhY2tncm91bmQ6IFwiIzVhYWVmZlwiLFxuICAgIHRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIHRleHRGb250OiBcIjQwMCAxM3B4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgZGF0ZVN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgdGV4dEZvbnQ6IFwiNDAwIDExcHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICB0ZXh0Q29sb3I6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICB9O1xuICBASW5wdXQoKSBjb252ZXJzYXRpb25zU3R5bGU6IENvbnZlcnNhdGlvbnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiOTclXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIHR5cGluZ0luZGljYXRvclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSVNfVFlQSU5HXCIpO1xuICBASW5wdXQoKSB0aHJlYWRJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIklOX0FfVEhSRUFEXCIpO1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgcmVjZWlwdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSB7fTtcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVNlbnQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRGVsZXRlITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlclVuYmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcblxuICBjY01lc3NhZ2VSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvblRleHRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVkaWFNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkZvcm1NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkNhcmRNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNSZWFkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZEJ5QWxsITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdTdGFydGVkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ0VuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxSZWplY3RlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsQWNjZXB0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGljb25TdHlsZTogYW55ID0ge1xuICAgIGljb25UaW50OiBcImxpZ2h0Z3JleVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgd2lkdGg6IFwiMjBweFwiLFxuICB9O1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IG5ldyBMaXN0U3R5bGUoe30pO1xuICBtZW51c3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBpY29uVGludDogXCJncmV5XCIsXG4gICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBpY29uQm9yZGVyOiBcIm5vbmVcIixcbiAgICBpY29uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiNzBweFwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMjBweFwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gIH07XG4gIHB1YmxpYyB0eXBpbmdJbmRpY2F0b3IhOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yIHwgbnVsbDtcbiAgcHVibGljIHR5cGluZ0xpc3RlbmVySWQ6IHN0cmluZyA9XG4gICAgXCJjb252ZXJzYXRpb25fX0xJU1RFTkVSXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgaXNEaWFsb2dPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0VtcHR5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiXCIsXG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiLFxuICB9O1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW107XG4gIHB1YmxpYyBzY3JvbGxlZFRvQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjaGVja0l0ZW1DaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29udmVyc2F0aW9uT3B0aW9ucyE6IENvbWV0Q2hhdE9wdGlvbltdO1xuICBwdWJsaWMgc2hvd0NvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblRvQmVEZWxldGVkOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF91c2VyX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBncm91cExpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2hhdGxpc3RfZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwVG9VcGRhdGU6IENvbWV0Q2hhdC5Hcm91cCB8IHt9ID0ge307XG4gIHB1YmxpYyBjb252ZXJzYXRpb25UeXBlPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuICBzYWZlSHRtbCE6IFNhZmVIdG1sO1xuICBlbmFibGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVTdGlja2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVXaGl0ZWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZURvY3VtZW50OiBib29sZWFuID0gZmFsc2U7XG4gIHRocmVhZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZC1hcnJvdy5zdmdcIjtcbiAgcHVibGljIGNvbmZpcm1EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgfTtcbiAgc3VidGl0bGVWYWx1ZSE6IHN0cmluZztcbiAgbW9kYWxTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIyMzBweFwiLFxuICAgIHdpZHRoOiBcIjI3MHB4XCIsXG4gIH07XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzQWN0aXZlOiBib29sZWFuID0gdHJ1ZTtcbiAgY29udGFjdHNOb3RGb3VuZDogYm9vbGVhbiA9IGZhbHNlO1xuICBjaGF0U2VhcmNoITogYm9vbGVhbjtcbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3Q7XG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIHB1YmxpYyBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0aWVzIHdpbGwgY29tZSBmcm9tIFBhcmVudC5cbiAgICovXG4gIEBJbnB1dCgpIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgLy9UbyBiZSBlbmFibGVkIGluIFVNQ1xuICAvLyBASW5wdXQoKSBtZW50aW9uc0ljb25VUkwhOiBzdHJpbmc7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+O1xuXG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIC8qKlxuICAgKiBwYXNzaW5nIHRoaXMgY2FsbGJhY2sgdG8gbWVudUxpc3QgY29tcG9uZW50IG9uIGRlbGV0ZSBjbGlja1xuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIGRlbGV0ZUNvbnZlcnNhdGlvbk9uQ2xpY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29uZmlybWF0aW9uRGlhbG9nKHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQhKTtcbiAgfTtcbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5kZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpO1xuICB9O1xuICBvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50LmRldGFpbC5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KGNvbnZlcnNhdGlvbiwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfVxuICBnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBjb25zdCBjb252V2l0aCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCk7XG5cbiAgICBpZiAoY29udldpdGggaW5zdGFuY2VvZiBDb21ldENoYXQuVXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KGNvbnZXaXRoKTtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAhdXNlclN0YXR1c1Zpc2liaWxpdHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0TWVudGlvbkljb25TdHlsZSgpOiBJY29uU3R5bGUge1xuICAvLyAgIHJldHVybiBuZXcgSWNvblN0eWxlKHtcbiAgLy8gICAgIGhlaWdodDogXCIxNnB4XCIsXG4gIC8vICAgICB3aWR0aDogXCIxNnB4XCIsXG4gIC8vICAgICBpY29uVGludDpcbiAgLy8gICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5tZW50aW9uSWNvblRpbnQgPz9cbiAgLy8gICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAvLyAgIH0pO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKClcbiAgICBpZiAoXG4gICAgICBpdGVtIGluc3RhbmNlb2YgQ29tZXRDaGF0LlVzZXJcbiAgICApIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShpdGVtKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSlcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbaXRlbT8uZ2V0U3RhdHVzKCldO1xuICAgICAgZWxzZSByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0dXNDb2xvcltpdGVtPy5nZXRUeXBlKCldXG4gICAgfVxuICB9XG5cbiAgZ2V0RXh0ZW5zaW9uRGF0YShtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgbWVzc2FnZVRleHQ7XG4gICAgLy94c3MgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgeHNzRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInhzcy1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgeHNzRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJzYW5pdGl6ZWRfdGV4dFwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJoYXNYU1NcIikgJiZcbiAgICAgIHhzc0RhdGEuaGFzWFNTID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHhzc0RhdGEuc2FuaXRpemVkX3RleHQ7XG4gICAgfVxuICAgIC8vZGF0YW1hc2tpbmcgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgbWFza2VkRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcImRhdGEtbWFza2luZ1wiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICBtYXNrZWREYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShtYXNrZWREYXRhLCBcImRhdGFcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICBtYXNrZWREYXRhLmRhdGEsXG4gICAgICAgIFwic2Vuc2l0aXZlX2RhdGFcIlxuICAgICAgKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgIG1hc2tlZERhdGEuZGF0YSxcbiAgICAgICAgXCJtZXNzYWdlX21hc2tlZFwiXG4gICAgICApICYmXG4gICAgICBtYXNrZWREYXRhLmRhdGEuc2Vuc2l0aXZlX2RhdGEgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0gbWFza2VkRGF0YS5kYXRhLm1lc3NhZ2VfbWFza2VkO1xuICAgIH1cbiAgICAvL3Byb2Zhbml0eSBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCBwcm9mYW5lRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInByb2Zhbml0eS1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgcHJvZmFuZURhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHByb2ZhbmVEYXRhLCBcInByb2Zhbml0eVwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkocHJvZmFuZURhdGEsIFwibWVzc2FnZV9jbGVhblwiKSAmJlxuICAgICAgcHJvZmFuZURhdGEucHJvZmFuaXR5ID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHByb2ZhbmVEYXRhLm1lc3NhZ2VfY2xlYW47XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlVGV4dCB8fCAobWVzc2FnZU9iamVjdCBhcyBhbnkpLnRleHQ7XG4gIH1cbiAgc2V0U3VidGl0bGUgPSAoY29udmVyc2F0aW9uT2JqZWN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgaWYgKHRoaXMudHlwaW5nSW5kaWNhdG9yKSB7XG4gICAgICBjb25zdCBpc1R5cGluZyA9XG4gICAgICAgIChjb252ZXJzYXRpb25PYmplY3QgYXMgYW55KT8uY29udmVyc2F0aW9uV2l0aD8uZ3VpZCA9PVxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCk7XG4gICAgICBpZiAoaXNUeXBpbmcpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMudHlwaW5nSW5kaWNhdG9yLmdldFNlbmRlcigpLmdldE5hbWUoKX0gJHt0aGlzLnR5cGluZ0luZGljYXRvclRleHRcbiAgICAgICAgICB9YDtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmplY3QgYXMgYW55KT8uY29udmVyc2F0aW9uV2l0aD8udWlkID09XG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yPy5nZXRTZW5kZXIoKS5nZXRVaWQoKSAmJlxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSAhPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGluZ0luZGljYXRvclRleHQ7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBzdWJ0aXRsZSA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0LFxuICAgICAgdGhpcy5sb2dnZWRJblVzZXIhLFxuXG4gICAgICB7XG4gICAgICAgIGRpc2FibGVNZW50aW9uczogdGhpcy5kaXNhYmxlTWVudGlvbnMsXG4gICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgbWVudGlvbnNUYXJnZXRFbGVtZW50OiBNZW50aW9uc1RhcmdldEVsZW1lbnQuY29udmVyc2F0aW9uLFxuICAgICAgICB0ZXh0Rm9ybWF0dGVyczogdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgfVxuICAgICk7XG4gICAgbGV0IGljb24gPVxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0Py5nZXRMYXN0TWVzc2FnZSgpPy5nZXRUeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgID8gXCLwn5OeIFwiXG4gICAgICAgIDogXCLwn5O5IFwiO1xuXG4gICAgcmV0dXJuIHRoaXMuc2FuaXRpemVyLmJ5cGFzc1NlY3VyaXR5VHJ1c3RIdG1sKFxuICAgICAgY29udmVyc2F0aW9uT2JqZWN0Py5nZXRMYXN0TWVzc2FnZSgpPy5nZXRDYXRlZ29yeSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsXG4gICAgICAgID8gaWNvbiArIHN1YnRpdGxlXG4gICAgICAgIDogc3VidGl0bGVcbiAgICApO1xuICB9O1xuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0VW5yZWFkTWVudGlvbnNJY29uU3R5bGUoKSB7XG4gIC8vICAgcmV0dXJuIHtcbiAgLy8gICAgIHBhZGRpbmdSaWdodDogXCIzcHhcIixcbiAgLy8gICB9O1xuICAvLyB9XG5cbiAgY2hlY2tHcm91cFR5cGUoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKTogc3RyaW5nIHtcbiAgICBsZXQgaW1hZ2U6IHN0cmluZyA9IFwiXCI7XG4gICAgaWYgKFxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICkge1xuICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgIHN3aXRjaCAoZ3JvdXAuZ2V0VHlwZSgpKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wYXNzd29yZDpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucGFzc3dvcmRHcm91cEljb24gfHwgdGhpcy5wcm90ZWN0ZWRHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuR3JvdXBUeXBlcy5wcml2YXRlOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wcml2YXRlR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGltYWdlID0gXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xuICB9XG4gIC8vIGNhbGxiYWNrIGZvciBjb25maXJtRGlhbG9nQ29tcG9uZW50XG4gIG9uQ2FuY2VsQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGdldE1lc3NhZ2VSZWNlaXB0ID0gKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGxldCByZWNlaXB0ID0gTWVzc2FnZVJlY2VpcHRVdGlscy5nZXRSZWNlaXB0U3RhdHVzKFxuICAgICAgY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKClcbiAgICApO1xuICAgIHJldHVybiByZWNlaXB0O1xuICB9O1xuICBnZXREYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGVQYXR0ZXJuID8/IERhdGVQYXR0ZXJucy5EYXlEYXRlVGltZTtcbiAgfVxuICBvcHRpb25zU3R5bGUgPSB7XG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZSxcbiAgICBwcml2YXRlIHNhbml0aXplcjogRG9tU2FuaXRpemVyXG4gICkgeyB9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5maXJzdFJlbG9hZCA9IHRydWU7XG4gICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcikge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIgPVxuICAgICAgICBuZXcgQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcigpXG4gICAgICAgICAgLnNldExpbWl0KHRoaXMubGltaXQpXG4gICAgfVxuICAgIHRoaXMuc2V0Q29udmVyc2F0aW9uT3B0aW9ucygpO1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycyh0aGlzLmNvbnZlcnNhdGlvblVwZGF0ZWQpO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIGlmICh0aGlzLnJlcXVlc3RCdWlsZGVyPy5nZXRDb252ZXJzYXRpb25UeXBlKCkpIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uVHlwZSA9IHRoaXMucmVxdWVzdEJ1aWxkZXIuZ2V0Q29udmVyc2F0aW9uVHlwZSgpO1xuICAgIH1cbiAgICB0aGlzLmdldENvbnZlcnNhdGlvbigpO1xuICB9XG4gIC8qKlxuICAqIERldGVybWluZXMgaWYgdGhlIGxhc3QgbWVzc2FnZSBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGUgYmFzZWQgb24gaXRzIGNhdGVnb3J5IGFuZCB0eXBlLlxuICAqXG4gICogQHBhcmFtIG1lc3NhZ2UgLSBUaGUgbGFzdCBtZXNzYWdlIHNlbnQgb3IgcmVjZWl2ZWQgaW4gdGhlIGNvbnZlcnNhdGlvbi5cbiAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBSZXR1cm5zIHRydWUgaWYgdGhlIG1lc3NhZ2Ugc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlLCBmYWxzZSBvdGhlcndpc2UuXG4gICovXG4gIGNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25UeXBlICYmIHRoaXMuY29udmVyc2F0aW9uVHlwZSAhPSBtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIENoZWNraW5nIGlmIHRoZSBtZXNzYWdlIGlzIGEgY3VzdG9tIG1lc3NhZ2VcbiAgICBsZXQgaXNDdXN0b21NZXNzYWdlID0gbWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmN1c3RvbVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgcmVwbHkgdG8gYW5vdGhlciBtZXNzYWdlXG4gICAgaWYgKG1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpICYmICFDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25NZXNzYWdlUmVwbGllcygpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpc0N1c3RvbU1lc3NhZ2UpIHtcbiAgICAgIGlmIChtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25NZXNzYWdlUmVwbGllcygpICYmIHRoaXMuc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYW4gYWN0aW9uIG1lc3NhZ2VcbiAgICBpZiAobWVzc2FnZT8uZ2V0Q2F0ZWdvcnkoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYSBncm91cCBtZW1iZXIgYWN0aW9uXG4gICAgICBpZiAobWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbkdyb3VwQWN0aW9ucygpO1xuICAgICAgfVxuICAgICAgLy8gQnkgZGVmYXVsdCwgYWN0aW9uIG1lc3NhZ2VzIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1lc3NhZ2UgaXMgYSBjYWxsIChlaXRoZXIgYXVkaW8gb3IgdmlkZW8pXG4gICAgaWYgKG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAobWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8gfHxcbiAgICAgICAgbWVzc2FnZS5nZXRUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbykpIHtcbiAgICAgIHJldHVybiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25DYWxsQWN0aXZpdGllcygpO1xuICAgIH1cbiAgICAvLyBCeSBkZWZhdWx0LCBtZXNzYWdlcyBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGVcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBzaG91bGRJbmNyZW1lbnRGb3JDdXN0b21NZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgY29uc3QgbWV0YWRhdGE6IGFueSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICAvLyBDaGVja2luZyBpZiB0aGUgY3VzdG9tIG1lc3NhZ2Ugc2hvdWxkIGluY3JlbWVudCB0aGUgdW5yZWFkIG1lc3NhZ2UgY291bnRlclxuICAgIHJldHVybiBtZXNzYWdlLndpbGxVcGRhdGVDb252ZXJzYXRpb24oKVxuICAgICAgfHwgKG1ldGFkYXRhICYmIG1ldGFkYXRhLmhhc093blByb3BlcnR5KFwiaW5jcmVtZW50VW5yZWFkQ291bnRcIikgJiYgbWV0YWRhdGEuaW5jcmVtZW50VW5yZWFkQ291bnQpIHx8IENvbWV0Q2hhdFVJS2l0LmNvbnZlcnNhdGlvblVwZGF0ZVNldHRpbmdzPy5zaG91bGRVcGRhdGVPbkN1c3RvbU1lc3NhZ2VzKCk7XG4gIH1cbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3Q29udmVyc2F0aW9ucygpO1xuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpICYmIHRoaXMuY2hlY2tJZkxhc3RNZXNzYWdlU2hvdWxkVXBkYXRlKGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpKSkge1xuICAgICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25JZCgpID09IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApO1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0LnNwbGljZShpbmRleCwgMSwgY29udmVyc2F0aW9uKTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmdyb3VwISk7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRMYXN0TWVzc2FnZShpdGVtLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckFkZGVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlckFkZGVkKSA9PiB7XG4gICAgICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBpdGVtLnVzZXJBZGRlZEluITtcbiAgICAgICAgICBsZXQgYWN0aW9uTWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbltdID0gaXRlbS5tZXNzYWdlcyE7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS51c2VyQWRkZWRJbiEpO1xuICAgICAgICAgIGNvbnZlcnNhdGlvbj8uc2V0Q29udmVyc2F0aW9uV2l0aChncm91cCk7XG4gICAgICAgICAgY29udmVyc2F0aW9uPy5zZXRMYXN0TWVzc2FnZShhY3Rpb25NZXNzYWdlW2FjdGlvbk1lc3NhZ2U/Lmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24hKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJLaWNrZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkID1cbiAgICAgICAgQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cE1lbWJlckJhbm5lZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbiA9IHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0ua2lja2VkRnJvbSEpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBEZWxldGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cERlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbSk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBMZWZ0ID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cExlZnQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICAgIChjPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkgPT1cbiAgICAgICAgICAgICAgaXRlbS5sZWZ0R3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID49IDApIHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIpIHtcbiAgICAgIHRoaXMuY2NVc2VyQmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyQmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbVVzZXIoaXRlbSk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbiAmJiAhdGhpcy5yZXF1ZXN0QnVpbGRlcj8uaXNJbmNsdWRlQmxvY2tlZFVzZXJzKCkpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjVXNlclVuYmxvY2tlZCA9IENvbWV0Q2hhdFVzZXJFdmVudHMuY2NVc2VyVW5ibG9ja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Vc2VyKSA9PiB7XG4gICAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPVxuICAgICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tVXNlcihpdGVtKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uICYmIHRoaXMucmVxdWVzdEJ1aWxkZXI/LmlzSW5jbHVkZUJsb2NrZWRVc2VycygpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIoaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG9iamVjdD8ubWVzc2FnZT8uZ2V0UmVjZWl2ZXJUeXBlKCkpIHtcbiAgICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqZWN0Lm1lc3NhZ2UhO1xuICAgICAgICAgIGlmIChvYmplY3Quc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50LnN1YnNjcmliZShcbiAgICAgIChvYmo6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqLm1lc3NhZ2UhO1xuICAgICAgICBpZiAob2JqLnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VEZWxldGVkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZU9iamVjdCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlUmVhZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlT2JqZWN0LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3RcbiAgICAgICAgICApLnRoZW4oKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2VPYmplY3QgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy5yZXNldFVucmVhZENvdW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsRW5kZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEVuZGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICBpZiAoY2FsbCAmJiBPYmplY3Qua2V5cyhjYWxsKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsUmVqZWN0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbFJlamVjdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NPdXRnb2luZ0NhbGwgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjT3V0Z29pbmdDYWxsLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDYWxsQWNjZXB0ZWQgPSBDb21ldENoYXRDYWxsRXZlbnRzLmNjQ2FsbEFjY2VwdGVkLnN1YnNjcmliZShcbiAgICAgIChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQWRkZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyS2lja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VTZW50Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRGVsZXRlPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTGVmdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlckJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJVbmJsb2NrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkPy51bnN1YnNjcmliZSgpO1xuICB9XG4gIGdldENvbnZlcnNhdGlvbkZyb21Vc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgKGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSA9PVxuICAgICAgICB1c2VyLmdldFVpZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVyc2F0aW9uTGlzdFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldENvbnZlcnNhdGlvbkZyb21Hcm91cChcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgKGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09XG4gICAgICAgIGdyb3VwLmdldEd1aWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2U6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGNoYW5nZVtcImFjdGl2ZUNvbnZlcnNhdGlvblwiXSkge1xuICAgICAgICB0aGlzLnJlc2V0VW5yZWFkQ291bnQoKTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgaWYgKGNoYW5nZVtcImNvbnZlcnNhdGlvbnNTdHlsZVwiXSkge1xuICAgICAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogV2hlbiB1c2VyIHNlbmRzIG1lc3NhZ2UgY29udmVyc2F0aW9uTGlzdCBpcyB1cGRhdGVkIHdpdGggbGF0ZXN0IG1lc3NhZ2VcbiAgICAgICAqL1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLy8gZ2V0dGluZyBkZWZhdWx0IGNvbnZlcnNhdGlvbiBvcHRpb24gYW5kIGFkZGluZyBjYWxsYmFjayBpbiBpdFxuICBzZXRDb252ZXJzYXRpb25PcHRpb25zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zID0gQ29udmVyc2F0aW9uVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0T3B0aW9uKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICFlbGVtZW50Lm9uQ2xpY2sgJiZcbiAgICAgICAgZWxlbWVudC5pZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Db252ZXJzYXRpb25PcHRpb25zLmRlbGV0ZVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uT25DbGljaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gcmVzZXQgdW5yZWFkIGNvdW50XG4gIG9uQ2xpY2soY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soY29udmVyc2F0aW9uKTtcbiAgICB9XG4gIH1cbiAgLy8gc2V0IHVucmVhZCBjb3VudFxuICByZXNldFVucmVhZENvdW50KCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbikge1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo/LmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAvL25ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpPy5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHNldHMgcHJvcGVydHkgZnJvbSB0aGVtZSB0byBzdHlsZSBvYmplY3RcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRCYWRnZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRDb25maXJtRGlhbG9nU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0UmVjZWlwdFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgfTtcbiAgICB0aGlzLmljb25TdHlsZS5pY29uVGludCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRDb252ZXJzYXRpb25zU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0gbmV3IENvbnZlcnNhdGlvbnNTdHlsZSh7XG4gICAgICBsYXN0TWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGxhc3RNZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIHRocmVhZEluZGljYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cbiAgc2V0UmVjZWlwdFN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHRoaXMucmVjZWlwdFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgc2V0QmFkZ2VTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYWRnZVN0eWxlID0gbmV3IEJhZGdlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGhlaWdodDogXCIxNnB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuYmFkZ2VTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmJhZGdlU3R5bGUgfTtcbiAgfVxuICBzZXRDb25maXJtRGlhbG9nU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUsXG4gICAgfTtcbiAgfVxuICAvLyBjaGVja2luZyBpZiB1c2VyIGhhcyBoaXMgb3duIGNvbmZpZ3VyYXRpb24gZWxzZSB3aWxsIHVzZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb25cbiAgLyoqXG4gICAqIEBwYXJhbSAge09iamVjdD17fX0gY29uZmlnXG4gICAqIEBwYXJhbSAge09iamVjdH0gZGVmYXVsdENvbmZpZz9cbiAgICogQHJldHVybnMgZGVmYXVsdENvbmZpZ1xuICAgKi9cbiAgLy8gY2FsbGluZyBzdWJ0aXRsZSBjYWxsYmFjayBmcm9tIGNvbmZpZ3VyYXRpb25zXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBjb3ZlcnNhdGlvbiBiYXNlZCBvbiB0aGUgY29udmVyc2F0aW9uUmVxdWVzdCBjb25maWdcbiAgICovXG4gIGZldGNoTmV4dENvbnZlcnNhdGlvbigpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgJiZcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBtZXNzYWdlPy5nZXRJZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYXR0YWNoZXMgTGlzdGVuZXJzIGZvciB1c2VyIGFjdGl2aXR5ICwgZ3JvdXAgYWN0aXZpdGllcyBhbmQgY2FsbGluZ1xuICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIGF0dGFjaExpc3RlbmVycyhjYWxsYmFjazogYW55KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSkge1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogb2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lLFxuICAgICAgICAgICAgICAgIG9ubGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9mZmxpbmUsXG4gICAgICAgICAgICAgICAgb2ZmbGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuZ3JvdXBMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAgbmV3U2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgb2xkU2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAga2lja2VkVXNlcjogYW55LFxuICAgICAgICAgICAgICBraWNrZWRCeTogYW55LFxuICAgICAgICAgICAgICBraWNrZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBraWNrZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShraWNrZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgYmFubmVkVXNlcjogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRCeTogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBiYW5uZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShiYW5uZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICB1c2VyQWRkZWQ6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkQnk6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW46IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogYW55LCBsZWF2aW5nVXNlcjogYW55LCBncm91cDogYW55KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBqb2luZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICAvLyBTREsgbGlzdGVuZXJzXG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAodGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgdGV4dE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVkaWFNZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgbWVkaWFNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBGb3JtTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGZvcm1NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoZm9ybU1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY2FyZE1lc3NhZ2U6IENhcmRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY2FyZE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtBc1JlYWQobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWRCeUFsbCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWRCeUFsbC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpKSkge1xuICAgICAgICAgICAgdGhpcy5tYXJrQXNSZWFkKG1lc3NhZ2VSZWNlaXB0KTtcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiBtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlUmVjZWlwdD8uZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQpO1xuXG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiBtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0Py5nZXRSZWNlaXZlclR5cGUoKSkpIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWxpdmVyZWRNZXNzYWdlKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdTdGFydGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZykge1xuICAgICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IHR5cGluZ0luZGljYXRvcjtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZldGNoTmV3Q29udmVyc2F0aW9ucygpIHtcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKTtcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlcj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW107XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oU3RhdGVzLmxvYWRlZCk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoZ3JvdXApXG4gICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbilcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZEJ5QWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEZldGNoZXMgQ29udmVyc2F0aW9ucyBEZXRhaWxzIHdpdGggYWxsIHRoZSB1c2Vyc1xuICAgKi9cbiAgZ2V0Q29udmVyc2F0aW9uID0gKHN0YXRlczogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyICYmXG4gICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24gJiZcbiAgICAgICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHxcbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPVxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpXG4gICAgKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGVzO1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgICAgICB0aGlzLmZldGNoTmV4dENvbnZlcnNhdGlvbigpXG4gICAgICAgICAgICAgIC50aGVuKChjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKClcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVzID09IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW1xuICAgICAgICAgICAgICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5lbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IGl0ZW06IGFueSA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCk7XG4gICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuICAgIGlmIChcbiAgICAgICF0aGlzLmRpc2FibGVSZWNlaXB0ICYmXG4gICAgICBtZXNzYWdlICYmXG4gICAgICAhbWVzc2FnZT8uZ2V0RGVsZXRlZEF0KCkgJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24gJiZcbiAgICAgIG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGwgJiZcbiAgICAgICghdGhpcy50eXBpbmdJbmRpY2F0b3IgfHxcbiAgICAgICAgKGl0ZW0/LnVpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkgJiZcbiAgICAgICAgICBpdGVtPy5ndWlkICE9IHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKSkpICYmXG4gICAgICBtZXNzYWdlLmdldFNlbmRlcigpPy5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb252ZXJzYXRpb24gbGlzdCdzIGxhc3QgbWVzc2FnZSAsIGJhZGdlQ291bnQgLCB1c2VyIHByZXNlbmNlIGJhc2VkIG9uIGFjdGl2aXRpZXMgcHJvcGFnYXRlZCBieSBsaXN0ZW5lcnNcbiAgICovXG4gIGNvbnZlcnNhdGlvblVwZGF0ZWQgPSAoXG4gICAga2V5OiBhbnksXG4gICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAgfCBudWxsID0gbnVsbCxcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgb3B0aW9ucyA9IG51bGxcbiAgKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9mZmxpbmU6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIoaXRlbSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRDoge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFOlxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYXJrTWVzc2FnZUFzRGVsaXZlcmVkID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIGNvbnN0IGlzR3JvdXBDb252ZXJzYXRpb24gPVxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBjb25zdCBpc1VzZXJDb252ZXJzYXRpb24gPVxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuXG4gICAgY29uc3QgaXNTYW1lR3JvdXAgPSB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGluc3RhbmNlb2YgQ29tZXRDaGF0Lkdyb3VwICYmIChcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgKT8uZ2V0R3VpZCgpID09PSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCk7XG5cbiAgICBjb25zdCBpc1NhbWVVc2VyID0gdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5Vc2VyICYmIChcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICApPy5nZXRVaWQoKSA9PT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpO1xuXG4gICAgY29uc3Qgc2hvdWxkTWFya0FzRGVsaXZlcmVkID1cbiAgICAgICF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fFxuICAgICAgKGlzR3JvdXBDb252ZXJzYXRpb24gJiYgaXNTYW1lR3JvdXApIHx8XG4gICAgICAoaXNVc2VyQ29udmVyc2F0aW9uICYmIGlzU2FtZVVzZXIpO1xuXG4gICAgaWYgKHNob3VsZE1hcmtBc0RlbGl2ZXJlZCAmJiAhbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpKSB7XG4gICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSByZWFkTWVzc2FnZVxuICAgKi9cbiAgZ2V0VWlueCA9ICgpID0+IHtcbiAgICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQoK25ldyBEYXRlKCkgLyAxMDAwKSk7XG4gIH07XG4gIG1hcmtBc1JlYWQocmVhZE1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIChcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgKS5nZXRJZCgpID09IE51bWJlcihyZWFkTWVzc2FnZS5nZXRNZXNzYWdlSWQoKSkgJiYgKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICApLmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqZWN0ITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbjtcbiAgICAgIGlmIChcbiAgICAgICAgIShcbiAgICAgICAgICBjb252ZXJzYXRpb25saXN0W1xuICAgICAgICAgICAgY29udmVyc2F0aW9uS2V5XG4gICAgICAgICAgXS5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLmdldFJlYWRBdCgpXG4gICAgICApIHtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0ID0gY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICAoXG4gICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0UmVhZEF0KHJlYWRNZXNzYWdlLmdldFJlYWRBdCgpKTtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LnNldFVucmVhZE1lc3NhZ2VDb3VudCgwKTtcbiAgICAgICAgKFxuICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdC5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldE11aWQodGhpcy5nZXRVaW54KCkpO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25saXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBEZXRhaWwgd2hlbiB1c2VyIGNvbWVzIG9ubGluZS9vZmZsaW5lXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Vc2VyfENvbWV0Q2hhdC5Hcm91cHxudWxsfSB1c2VyXG4gICAqL1xuICB1cGRhdGVVc2VyKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICAvL3doZW4gdXNlciB1cGRhdGVzXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbXG4gICAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgIF07XG4gICAgICAvL0dldHMgdGhlIGluZGV4IG9mIHVzZXIgd2hpY2ggY29tZXMgb2ZmbGluZS9vbmxpbmVcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IGNvbnZlcnNhdGlvbmxpc3QuZmluZEluZGV4KFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09XG4gICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpID09PVxuICAgICAgICAgICh1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoT2JqOiBDb21ldENoYXQuVXNlciA9XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcjtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aE9iai5zZXRTdGF0dXMoKHVzZXIgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFN0YXR1cygpKTtcbiAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldENvbnZlcnNhdGlvbldpdGgoY29udmVyc2F0aW9uV2l0aE9iaik7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9ubGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBuZXdDb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBjb252ZXJzYXRpb25saXN0O1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBHZXRzIHRoZSBsYXN0IG1lc3NhZ2VcbiAgICogQHBhcmFtIGNvbnZlcnNhdGlvblxuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgbWFrZUxhc3RNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCB7fSA9IHt9XG4gICkge1xuICAgIGNvbnN0IG5ld01lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHJldHVybiBuZXdNZXNzYWdlO1xuICB9XG4gIHVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uLCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBpZiAobWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCkge1xuXG4gICAgICBjb25zdCBpc1NhbWVHcm91cCA9IChtZXNzYWdlLmdldFJlY2VpdmVyKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkgPT09XG4gICAgICAgIChtZXNzYWdlLmdldEFjdGlvbkZvcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpO1xuXG4gICAgICBpZiAoaXNTYW1lR3JvdXApIHtcbiAgICAgICAgbGV0IHVwZGF0ZWRHcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwO1xuICAgICAgICB1cGRhdGVkR3JvdXAuc2V0TWVtYmVyc0NvdW50KChtZXNzYWdlLmdldEFjdGlvbkZvcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0TWVtYmVyc0NvdW50KCkpO1xuICAgICAgICBjb252ZXJzYXRpb24uc2V0Q29udmVyc2F0aW9uV2l0aCh1cGRhdGVkR3JvdXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogVXBkYXRlcyBDb252ZXJzYXRpb25zIGFzIFRleHQvQ3VzdG9tIE1lc3NhZ2VzIGFyZSByZWNlaXZlZFxuICAgKiBAcGFyYW1cbiAgICpcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Ym9vbGVhbn0gbm90aWZpY2F0aW9uXG4gICAqL1xuICB1cGRhdGVDb252ZXJzYXRpb24oXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG5vdGlmaWNhdGlvbjogYm9vbGVhbiA9IHRydWVcbiAgKSB7XG4gICAgbGV0IG1ldGFkYXRhOiBhbnk7XG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgICAgbWV0YWRhdGEgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5jaGVja0lmTGFzdE1lc3NhZ2VTaG91bGRVcGRhdGUobWVzc2FnZSkpIHtcbiAgICAgICAgdGhpcy5tYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGxldCBpc0N1c3RvbU1lc3NhZ2U6IGJvb2xlYW4gPSBtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgICAgICAgIC8vIGlmIHNlbmRlciBpcyBub3QgbG9nZ2VkIGluIHVzZXIgdGhlbiAgaW5jcmVtZW50IGNvdW50XG4gICAgICAgICAgICAgIGxldCB1bnJlYWRNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgICAgICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSB8fFxuICAgICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0UmVjZWl2ZXJJZCgpKVxuICAgICAgICAgICAgICAgICAgPyB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICAgICAgOiB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKSAtIDE7XG4gICAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gdGhpcy5tYWtlTGFzdE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmpcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgbmV3Q29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlLmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQodW5yZWFkTWVzc2FnZUNvdW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbGFzdE1lc3NhZ2VPYmouZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgIT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCB0aW1lc0xvZ2dlZEluVXNlcklzTWVudGlvbmVkID0gMDtcbiAgICAgICAgICAgICAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBsYXN0TWVzc2FnZU9iai5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgICAgICAgICAgICAgIGlmIChtZW50aW9uZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoXG4gICAgICAgICAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEpO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnVuc2hpZnQobmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiA9IG5ld0NvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGluY3JlbWVudENvdW50ID0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPyAxIDogMFxuICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmogPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKGxhc3RNZXNzYWdlT2JqKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlLmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQoaW5jcmVtZW50Q291bnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICB1cGRhdGVEZWxpdmVyZWRNZXNzYWdlKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpIHtcbiAgICBsZXQgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gWy4uLnRoaXMuY29udmVyc2F0aW9uTGlzdF07XG4gICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgKFxuICAgICAgICAgIGMuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgKS5nZXRJZCgpID09IE51bWJlcihtZXNzYWdlUmVjZWlwdC5nZXRNZXNzYWdlSWQoKSkgJiYgKFxuICAgICAgICAgIGMuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgKS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICApO1xuICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb247XG4gICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICBjb252ZXJzYXRpb25PYmogPSBjb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICBpZiAoXG4gICAgICAgICEoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuZ2V0RGVsaXZlcmVkQXQoKVxuICAgICAgKSB7XG4gICAgICAgIChcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXREZWxpdmVyZWRBdChOdW1iZXIodGhpcy5nZXRVaW54KCkpKTtcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogR2V0cyBUaGUgQ291bnQgb2YgVW5yZWFkIE1lc3NhZ2VzXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gY29udmVyc2F0aW9uXG4gICAqIEBwYXJhbSAge2FueX0gb3BlcmF0b3JcbiAgICovXG4gIG1ha2VVbnJlYWRNZXNzYWdlQ291bnQoXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLFxuICAgIG9wZXJhdG9yOiBhbnkgPSBudWxsXG4gICkge1xuICAgIGlmIChPYmplY3Qua2V5cyhjb252ZXJzYXRpb24pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGxldCB1bnJlYWRNZXNzYWdlQ291bnQ6IG51bWJlciA9IGNvbnZlcnNhdGlvbi5nZXRVbnJlYWRNZXNzYWdlQ291bnQoKTtcbiAgICBpZiAoXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT1cbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgKSB7XG4gICAgICB1bnJlYWRNZXNzYWdlQ291bnQgKz0gMTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmhhc093blByb3BlcnR5KFwiZ3VpZFwiKSAmJlxuICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpLmhhc093blByb3BlcnR5KFwiZ3VpZFwiKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApLmdldEd1aWQoKSA9PT1cbiAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCkpIHx8XG4gICAgICAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uaGFzT3duUHJvcGVydHkoXCJ1aWRcIikgJiZcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKS5oYXNPd25Qcm9wZXJ0eShcInVpZFwiKSAmJlxuICAgICAgICAoXG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICkuZ2V0VWlkKCkgPT09XG4gICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSlcbiAgICApIHtcbiAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcGVyYXRvciAmJiBvcGVyYXRvciA9PT0gXCJkZWNyZW1lbnRcIikge1xuICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSB1bnJlYWRNZXNzYWdlQ291bnQgPyB1bnJlYWRNZXNzYWdlQ291bnQgLSAxIDogMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IHVucmVhZE1lc3NhZ2VDb3VudCArIDE7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bnJlYWRNZXNzYWdlQ291bnQ7XG4gIH1cbiAgLyoqXG4gICAqIENoYW5nZXMgZGV0YWlsIG9mIGNvbnZlcnNhdGlvbnNcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAoYzogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjPy5nZXRDb252ZXJzYXRpb25JZCgpID09PSBtZXNzYWdlPy5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+PSAwKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICBjb252ZXJzYXRpb25LZXk6IGNvbnZlcnNhdGlvbktleSxcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo6IGNvbnZlcnNhdGlvbixcbiAgICAgICAgICBjb252ZXJzYXRpb25MaXN0OiB0aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShtZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgaW5zdGFuY2VvZiBDb21ldENoYXQuR3JvdXAgJiZcbiAgICAgICAgICAgICAgIShcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICAgICApLmdldFNjb3BlKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICAgKS5zZXRIYXNKb2luZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuc2V0U2NvcGUoXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJTY29wZS5wYXJ0aWNpcGFudFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbktleTogLTEsXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iajogY29udmVyc2F0aW9uLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0OiB0aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHJlamVjdChlcnJvcikpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIENvbnZlcnNhdGlvbiBWaWV3IHdoZW4gbWVzc2FnZSBpcyBlZGl0ZWQgb3IgZGVsZXRlZFxuICAgKi9cbiAgY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5tYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2UpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uS2V5O1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICByZXNwb25zZS5jb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uTGlzdCA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpO1xuICAgICAgICAgICAgaWYgKGxhc3RNZXNzYWdlT2JqLmdldElkKCkgPT09IG1lc3NhZ2UuZ2V0SWQoKSkge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouc2V0TGFzdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgICAgICAgKS5zZXRNdWlkKHRoaXMuZ2V0VWlueCgpKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBjb252ZXJzYXRpb25PYmopO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogSWYgVXNlciBzY3JvbGxzIHRvIHRoZSBib3R0b20gb2YgdGhlIGN1cnJlbnQgQ29udmVyc2F0aW9uIGxpc3QgdGhhbiBmZXRjaCBuZXh0IGl0ZW1zIG9mIHRoZSBDb252ZXJzYXRpb24gbGlzdCBhbmQgYXBwZW5kXG4gICAqIEBwYXJhbSBFdmVudFxuICAgKi9cbiAgLyoqXG4gICAqIFBsYXlzIEF1ZGlvIFdoZW4gTWVzc2FnZSBpcyBSZWNlaXZlZFxuICAgKi9cbiAgcGxheUF1ZGlvKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoXG4gICAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQuaW5jb21pbmdNZXNzYWdlRnJvbU90aGVyXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKlxuICAgKiBVcGRhdGVzIHRoZSBjb252ZXNhdGlvbiBsaXN0IHdoZW4gZGVsZXRlZC5cbiAgICogQWRkaW5nIENvbnZlcnNhdGlvbiBPYmplY3QgdG8gQ29tZXRjaGF0U2VydmljZVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgdXBkYXRlQ29udmVyc2F0aW9uTGlzdChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50Py5nZXRDb252ZXJzYXRpb25JZCgpID09IGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBzaG93aW5nIGRpYWxvZyBmb3IgY29uZmlybSBhbmQgY2FuY2VsXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgc2hvd0NvbmZpcm1hdGlvbkRpYWxvZyA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IHRydWU7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIG9uT3B0aW9uQ2xpY2soZXZlbnQ6IGFueSwgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IG9wdGlvbjogQ29tZXRDaGF0T3B0aW9uID0gZXZlbnQ/LmRldGFpbD8uZGF0YTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gY29udmVyc2F0aW9uO1xuICAgIGlmIChvcHRpb24pIHtcbiAgICAgIG9wdGlvbi5vbkNsaWNrISgpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogc2hvdyBjb25maXJtIGRpYWxvZyBzY3JlZW5cbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0b25cbiAgICovXG4gIC8vIGNoZWNrIGlzIHRoZXJlIGlzIGFueSBhY3RpdmUgY29udmVyc2F0aW9uIGFuZCBtYXJrIGl0IGFzIGFjdGl2ZVxuICBnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZSA9PSBTZWxlY3Rpb25Nb2RlLm5vbmUgfHwgIXRoaXMuc2VsZWN0aW9uTW9kZSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkID09XG4gICAgICAgIChjb252ZXJzYXRpb24gYXMgYW55KT8uY29udmVyc2F0aW9uSWRcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGhhbmRsZSBjb25maXJtIGRpYWxvZyByZXNwb25zZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHZhbHVlXG4gICAqL1xuICAvLyBjYWxsaW5nIGNvbWV0Y2hhdC5kZWxldGVDb252ZXJzYXRpb24gbWV0aG9kXG4gIGRlbGV0ZVNlbGVjdGVkQ29udmVyc2F0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZC5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBudWxsO1xuICAgICAgfVxuICAgICAgbGV0IGNvbnZlcnNhdGlvbldpdGg7XG4gICAgICBsZXQgY29udmVyc2F0aW9uVHlwZSA9IHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpO1xuICAgICAgaWYgKFxuICAgICAgICBjb252ZXJzYXRpb25UeXBlID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICkge1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoID0gKFxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICkuZ2V0VWlkKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoID0gKFxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICApLmdldEd1aWQoKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5kZWxldGVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uV2l0aCwgY29udmVyc2F0aW9uVHlwZSkudGhlbihcbiAgICAgICAgKGRlbGV0ZWRDb252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICBDb21ldENoYXRDb252ZXJzYXRpb25FdmVudHMuY2NDb252ZXJzYXRpb25EZWxldGVkLm5leHQoXG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkIVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQpO1xuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBudWxsO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuaXNEaWFsb2dPcGVuID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIC8vIGV4cG9zZWQgbWV0aG9kcyB0byB1c2Vycy5cbiAgdXBkYXRlTGFzdE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdChjb252ZXJzYXRpb24pO1xuICB9XG4gIHN0eWxlczogYW55ID0ge1xuICAgIHdyYXBwZXJTdHlsZTogKCkgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5oZWlnaHQsXG4gICAgICAgIHdpZHRoOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS53aWR0aCxcbiAgICAgICAgYm9yZGVyOlxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlciB8fFxuICAgICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgICAgIGJvcmRlclJhZGl1czogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuYm9yZGVyUmFkaXVzLFxuICAgICAgICBiYWNrZ3JvdW5kOlxuICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJhY2tncm91bmQgfHxcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIH07XG4gICAgfSxcbiAgfTtcbiAgc3VidGl0bGVTdHlsZSA9IChjb252ZXJzYXRpb246IGFueSkgPT4ge1xuICAgIGlmIChcbiAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yICYmXG4gICAgICAoKHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVyVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRTZW5kZXIoKS5nZXRVaWQoKSA9PVxuICAgICAgICBjb252ZXJzYXRpb24uY29udmVyc2F0aW9uV2l0aD8udWlkKSB8fFxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/Lmd1aWQpXG4gICAgKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnR5cGluZ0luZGljdG9yVGV4dENvbG9yLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbnQ6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dEZvbnQsXG4gICAgICBjb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUubGFzdE1lc3NhZ2VUZXh0Q29sb3IsXG4gICAgfTtcbiAgfTtcbiAgaXRlbVRocmVhZEluZGljYXRvclN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0Rm9udDpcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGhyZWFkSW5kaWNhdG9yVGV4dEZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHRleHRDb2xvcjpcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGhyZWFkSW5kaWNhdG9yVGV4dENvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgfTtcbiAgfTtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zXCIgW25nU3R5bGVdPVwic3R5bGVzLndyYXBwZXJTdHlsZSgpXCI+XG4gIDxjb21ldGNoYXQtYmFja2Ryb3AgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiICpuZ0lmPVwiaXNEaWFsb2dPcGVuXCI+XG4gICAgPGNvbWV0Y2hhdC1jb25maXJtLWRpYWxvZyBbdGl0bGVdPVwiY29uZmlybURpYWxvZ1RpdGxlXCJcbiAgICAgIFttZXNzYWdlVGV4dF09XCJjb25maXJtRGlhbG9nTWVzc2FnZVwiIFtjYW5jZWxCdXR0b25UZXh0XT1cImNhbmNlbEJ1dHRvblRleHRcIlxuICAgICAgW2NvbmZpcm1CdXR0b25UZXh0XT1cImNvbmZpcm1CdXR0b25UZXh0XCJcbiAgICAgIChjYy1jb25maXJtLWNsaWNrZWQpPVwib25Db25maXJtQ2xpY2soKVwiXG4gICAgICAoY2MtY2FuY2VsLWNsaWNrZWQpPVwib25DYW5jZWxDbGljaygpXCJcbiAgICAgIFtjb25maXJtRGlhbG9nU3R5bGVdPVwiZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGVcIj5cbiAgICA8L2NvbWV0Y2hhdC1jb25maXJtLWRpYWxvZz5cbiAgPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4gIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19tZW51c1wiICpuZ0lmPVwibWVudVwiPlxuXG4gICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cIm1lbnVcIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cblxuICA8L2Rpdj5cbiAgPGNvbWV0Y2hhdC1saXN0IFtzdGF0ZV09XCJzdGF0ZVwiIFtzZWFyY2hJY29uVVJMXT1cInNlYXJjaEljb25VUkxcIlxuICAgIFtoaWRlRXJyb3JdPVwiaGlkZUVycm9yXCIgW2VtcHR5U3RhdGVUZXh0XT1cImVtcHR5U3RhdGVUZXh0XCJcbiAgICBbbG9hZGluZ0ljb25VUkxdPVwibG9hZGluZ0ljb25VUkxcIiBbdGl0bGVBbGlnbm1lbnRdPVwidGl0bGVBbGlnbm1lbnRcIlxuICAgIFtsb2FkaW5nU3RhdGVWaWV3XT1cImxvYWRpbmdTdGF0ZVZpZXdcIiBbbGlzdFN0eWxlXT1cImxpc3RTdHlsZVwiXG4gICAgW2VtcHR5U3RhdGVWaWV3XT1cImVtcHR5U3RhdGVWaWV3XCIgW2Vycm9yU3RhdGVUZXh0XT1cImVycm9yU3RhdGVUZXh0XCJcbiAgICBbZXJyb3JTdGF0ZVZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cImdldENvbnZlcnNhdGlvblwiXG4gICAgW2xpc3RdPVwiY29udmVyc2F0aW9uTGlzdFwiXG4gICAgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiPjwvY29tZXRjaGF0LWxpc3Q+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNvbnZlcnNhdGlvbj5cbiAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwiZ2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUoY29udmVyc2F0aW9uKVwiXG4gICAgW2lkXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uSWRcIlxuICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKVwiXG4gICAgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25DbGljayhjb252ZXJzYXRpb24pXCJcbiAgICBbdGl0bGVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgIFthdmF0YXJVUkxdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5hdmF0YXIgfHwgY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5pY29uXCJcbiAgICBbYXZhdGFyTmFtZV09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbldpdGg/Lm5hbWVcIj5cbiAgICA8ZGl2IHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIiAqbmdJZj1cInN1YnRpdGxlVmlldztlbHNlIGNvbnZlcnNhdGlvblN1YnRpdGxlXCI+XG4gICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwic3VidGl0bGVWaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IGNvbnZlcnNhdGlvbiB9XCI+XG4gICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICA8L2Rpdj5cbiAgICA8bmctdGVtcGxhdGUgI2NvbnZlcnNhdGlvblN1YnRpdGxlPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc3VidGl0bGUtdmlldyBcIiBzbG90PVwic3VidGl0bGVWaWV3XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX190aHJlYWR2aWV3XCJcbiAgICAgICAgICAqbmdJZj1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2U/LnBhcmVudE1lc3NhZ2VJZFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtbGFiZWwgW2xhYmVsU3R5bGVdPVwiaXRlbVRocmVhZEluZGljYXRvclN0eWxlKClcIlxuICAgICAgICAgICAgW3RleHRdPVwidGhyZWFkSW5kaWNhdG9yVGV4dFwiPiA8L2NvbWV0Y2hhdC1sYWJlbD5cbiAgICAgICAgICA8Y29tZXRjaGF0LWljb24gW1VSTF09XCJ0aHJlYWRJY29uVVJMXCJcbiAgICAgICAgICAgIFtpY29uU3R5bGVdPVwiaWNvblN0eWxlXCI+PC9jb21ldGNoYXQtaWNvbj5cblxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3N1YnRpdGxlXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3JlYWRyZWNlaXB0XCJcbiAgICAgICAgICAgICpuZ0lmPVwiaXNSZWNlaXB0RGlzYWJsZShjb252ZXJzYXRpb24pXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LXJlY2VpcHQgW3JlY2VpcHRdPVwiZ2V0TWVzc2FnZVJlY2VpcHQoY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgICAgIFtyZWNlaXB0U3R5bGVdPVwicmVjZWlwdFN0eWxlXCIgW3NlbnRJY29uXT1cInNlbnRJY29uXCJcbiAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIiBbZGVsaXZlcmVkSWNvbl09XCJkZWxpdmVyZWRJY29uXCJcbiAgICAgICAgICAgICAgW3JlYWRJY29uXT1cInJlYWRJY29uXCI+PC9jb21ldGNoYXQtcmVjZWlwdD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgW25nU3R5bGVdPVwic3VidGl0bGVTdHlsZShjb252ZXJzYXRpb24pXCIgY2xhc3M9XCJjYy1zdWJ0aXRsZV9fdGV4dFwiXG4gICAgICAgICAgICBbaW5uZXJIVE1MXT1cInNldFN1YnRpdGxlKGNvbnZlcnNhdGlvbilcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgIDwvZGl2PlxuICAgIDwvbmctdGVtcGxhdGU+XG4gICAgPGRpdiBzbG90PVwibWVudVZpZXdcIiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX29wdGlvbnN2aWV3XCJcbiAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCI+XG4gICAgICA8ZGl2ICpuZ0lmPVwib3B0aW9uc1wiPlxuICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbZGF0YV09XCJvcHRpb25zKGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwib25PcHRpb25DbGljaygkZXZlbnQsY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgW21lbnVMaXN0U3R5bGVdPVwibWVudXN0eWxlXCI+XG5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2ICpuZ0lmPVwiIW9wdGlvbnMgJiYgY29udmVyc2F0aW9uT3B0aW9uc1wiPlxuICAgICAgICA8Y29tZXRjaGF0LW1lbnUtbGlzdCBbZGF0YV09XCJjb252ZXJzYXRpb25PcHRpb25zXCJcbiAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50LGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVzdHlsZVwiPlxuXG4gICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIDxkaXYgc2xvdD1cInRhaWxWaWV3XCIgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX190YWlsLXZpZXdcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0YWlsX192aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmUgJiYgY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSAqbmdJZj1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2VcIlxuICAgICAgICAgICAgW2RhdGVTdHlsZV09XCJkYXRlU3R5bGVcIlxuICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlPy5zZW50QXRcIlxuICAgICAgICAgICAgW3BhdHRlcm5dPVwiZ2V0RGF0ZSgpXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19iYWRnZVwiPlxuICAgICAgICAgIDwhLS0gPGNvbWV0Y2hhdC1pY29uICpuZ0lmPVwiY29udmVyc2F0aW9uPy5nZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoKVwiIFtuZ1N0eWxlXT1cImdldFVucmVhZE1lbnRpb25zSWNvblN0eWxlKClcIiBbaWNvblN0eWxlXT1nZXRNZW50aW9uSWNvblN0eWxlKCkgW1VSTF09XCJtZW50aW9uc0ljb25VUkxcIj48L2NvbWV0Y2hhdC1pY29uPiAtLT5cbiAgICAgICAgICA8Y29tZXRjaGF0LWJhZGdlIFtjb3VudF09XCJjb252ZXJzYXRpb24/LnVucmVhZE1lc3NhZ2VDb3VudFwiXG4gICAgICAgICAgICBbYmFkZ2VTdHlsZV09XCJiYWRnZVN0eWxlXCI+PC9jb21ldGNoYXQtYmFkZ2U+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc2VsZWN0aW9uLXZpZXdcIlxuICAgICAgICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgIT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICA8bmctY29udGFpbmVyICpuZ1RlbXBsYXRlT3V0bGV0PVwidGFpbFZpZXdcIj5cbiAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9jb21ldGNoYXQtbGlzdC1pdGVtPlxuICA8bmctdGVtcGxhdGUgI3RhaWxWaWV3PlxuICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLnNpbmdsZVwiPlxuICAgICAgPGNvbWV0Y2hhdC1yYWRpby1idXR0b25cbiAgICAgICAgKGNjLXJhZGlvLWJ1dHRvbi1jaGFuZ2VkKT1cIm9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uLCRldmVudClcIj48L2NvbWV0Y2hhdC1yYWRpby1idXR0b24+XG4gICAgPC9kaXY+XG4gICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubXVsdGlwbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtY2hlY2tib3hcbiAgICAgICAgKGNjLWNoZWNrYm94LWNoYW5nZWQpPVwib25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb24sJGV2ZW50KVwiPjwvY29tZXRjaGF0LWNoZWNrYm94PlxuICAgIDwvZGl2PlxuICA8L25nLXRlbXBsYXRlPlxuPC9uZy10ZW1wbGF0ZT5cbiJdfQ==