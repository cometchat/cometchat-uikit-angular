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
import { processSubtitleContent } from '@cometchat/uikit-elements';
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
        /**
         * @deprecated
         *
         * This property is deprecated as of version 4.3.16 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
         */
        this.disableReceipt = false;
        this.hideReceipt = false;
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
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: "#2196F3",
            uncheckedBackgroundColor: "#ccc"
        };
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
            const lastMessage = conversationObject.getLastMessage();
            if (lastMessage && lastMessage?.getType() === CometChatUIKitConstants.MessageTypes.text) {
                lastMessage.setText(processSubtitleContent(lastMessage.getText()));
            }
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
            if (!message.hasOwnProperty("deliveredAt") && message.getSender().getUid() !== this.loggedInUser?.getUid() &&
                (!this.disableReceipt || this.hideReceipt) && (!this.activeConversation || this.activeConversation?.getConversationId() != message.getConversationId())) {
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
            let conversation = this.getConversationFromId(messageObject.getConversationId());
            if (conversation) {
                this.updateEditedMessage(conversation.getLastMessage());
                this.resetUnreadCount(conversation.getConversationId());
                return;
            }
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
        this.ccGroupCreated = CometChatGroupEvents.ccGroupCreated.subscribe((group) => {
            CometChat.getConversation(group.getGuid(), CometChatUIKitConstants.MessageReceiverType.group).then((conversation) => {
                this.conversationList.unshift(conversation);
                this.ref.detectChanges();
            })
                .catch((error) => {
                if (this.onError) {
                    this.onError(error);
                }
            });
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
        this.ccGroupCreated?.unsubscribe();
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
    getConversationFromId(id) {
        let index = this.conversationList.findIndex((element) => element.getConversationId() == id);
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
    resetUnreadCount(conversationId) {
        const targetConversationId = conversationId || this.activeConversation?.getConversationId();
        if (!targetConversationId)
            return;
        const conversationIndex = this.conversationList.findIndex((conv) => conv.getConversationId() === targetConversationId);
        if (conversationIndex < 0)
            return;
        const updatedConversation = this.conversationList[conversationIndex];
        updatedConversation.setUnreadMessageCount(0);
        const lastMessage = updatedConversation.getLastMessage();
        if (lastMessage instanceof CometChat.TextMessage) {
            lastMessage.setMuid(this.getUinx());
        }
        this.conversationList = [
            ...this.conversationList.slice(0, conversationIndex),
            updatedConversation,
            ...this.conversationList.slice(conversationIndex + 1),
        ];
        this.ref.detectChanges();
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
        this.checkboxStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "4px",
            checkedBackgroundColor: this.themeService.theme.palette.getPrimary(),
            uncheckedBackgroundColor: this.themeService.theme.palette.getAccent400()
        };
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
        if (!(this.disableReceipt || this.hideReceipt) &&
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
        const conversationKey = conversationlist.findIndex((conversationObj) => conversationObj.getLastMessage()?.getId() == Number(readMessage.getMessageId()) && conversationObj.getLastMessage().getSender().getUid() == this.loggedInUser?.getUid());
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
                            if (!this.disableSoundForMessages) {
                                this.playAudio();
                            }
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
                            if (!this.disableSoundForMessages) {
                                this.playAudio();
                            }
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
        let conversationKey = conversationList.findIndex((c) => c.getLastMessage()?.getId() == Number(messageReceipt.getMessageId()) && c.getLastMessage().getSender().getUid() == this.loggedInUser?.getUid());
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
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther, this.customSoundForMessages);
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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", hideReceipt: "hideReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"getStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\"\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingStateView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorStateView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"getStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar || conversation?.conversationWith?.icon\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView;context:{ $implicit: conversation }\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\"\n        *ngIf=\"selectionMode == selectionmodeEnum.none && conversation?.lastMessage\">\n        <div class=\"cc-date\">\n          <cometchat-date *ngIf=\"conversation?.lastMessage\"\n            [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox [checkboxStyle]=\"checkboxStyle\"\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
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
            }], hideReceipt: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUVWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1oscUJBQXFCLEVBQ3JCLGFBQWEsRUFFYixhQUFhLEVBQ2IsTUFBTSxFQUNOLGNBQWMsRUFFZCxVQUFVLEVBQ1YsUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBR3ZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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M0IsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyxZQUFZO3NCQUFwQixLQUFLO2dCQTZIRyxZQUFZO3NCQUFwQixLQUFLO2dCQUdHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcblxuaW1wb3J0IHtcbiAgQXZhdGFyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEJhZGdlU3R5bGUsXG4gIENoZWNrYm94U3R5bGUsXG4gIENvbmZpcm1EaWFsb2dTdHlsZSxcbiAgRGF0ZVN0eWxlLFxuICBJY29uU3R5bGUsXG4gIExpc3RJdGVtU3R5bGUsXG4gIFJlY2VpcHRTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEJhc2VTdHlsZSxcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIENvbnZlcnNhdGlvblV0aWxzLFxuICBDb252ZXJzYXRpb25zU3R5bGUsXG4gIExpc3RTdHlsZSxcbiAgTWVzc2FnZVJlY2VpcHRVdGlscyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDYXJkTWVzc2FnZSxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgQ29tZXRDaGF0VXNlckV2ZW50cyxcbiAgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICBEYXRlUGF0dGVybnMsXG4gIEZvcm1NZXNzYWdlLFxuICBJR3JvdXBMZWZ0LFxuICBJR3JvdXBNZW1iZXJBZGRlZCxcbiAgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLFxuICBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQsXG4gIElNZXNzYWdlcyxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBTY2hlZHVsZXJNZXNzYWdlLFxuICBTZWxlY3Rpb25Nb2RlLFxuICBTdGF0ZXMsXG4gIFRpdGxlQWxpZ25tZW50LFxuICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBIb3N0QmluZGluZyxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBEb21TYW5pdGl6ZXIsIFNhZmVIdG1sIH0gZnJvbSBcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBNZXNzYWdlVXRpbHMgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL01lc3NhZ2VVdGlsc1wiO1xuaW1wb3J0IHtwcm9jZXNzU3VidGl0bGVDb250ZW50fSBmcm9tICdAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzJ1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRDb252ZXJzYXRpb24gaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29udmVyc2F0aW9uTGlzdENvbXBvbmVudC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY29udmVyc2F0aW9uc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENvbnZlcnNhdGlvbnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0hBVFNcIik7IC8vVGl0bGUgb2YgdGhlIGNvbXBvbmVudFxuICBASW5wdXQoKSBvcHRpb25zITpcbiAgICB8ICgoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiBDb21ldENoYXRPcHRpb25bXSlcbiAgICB8IG51bGw7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlSG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTsgLy8gcGxhY2Vob2xkZXIgdGV4dCBvZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy4xNiBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ2hpZGVSZWNlaXB0Jy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHN1YnNlcXVlbnQgdmVyc2lvbnMuXG4gICAqL1xuICBASW5wdXQoKSBkaXNhYmxlUmVjZWlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBoaWRlUmVjZWlwdDogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSByZWFkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1yZWFkLnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhcm5pbmctc21hbGwuc3ZnXCI7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIHNlbnRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXNlbnQuc3ZnXCI7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKlxuICAgKiBUaGlzIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgYXMgb2YgdmVyc2lvbiA0LjMuNyBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ3Bhc3N3b3JkR3JvdXBJY29uJy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHN1YnNlcXVlbnQgdmVyc2lvbnMuXG4gICAqL1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgcGFzc3dvcmRHcm91cEljb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlczogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgYWN0aXZlQ29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7IC8vc2VsZWN0ZWQgY29udmVyc2F0aW9uXG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjsgLy9pbWFnZSBVUkwgb2YgdGhlIHNlYXJjaCBpY29uXG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSB0cnVlOyAvL3N3aXRjaCBvbi9mZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblNlbGVjdCE6IChcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW5cbiAgKSA9PiB2b2lkO1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQ0hBVFNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcblxuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7XG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjb25maXJtRGlhbG9nVGl0bGUgPSBsb2NhbGl6ZShcIkRFTEVURV9DT05WRVJTQVRJT05cIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRFTEVURVwiKTtcbiAgQElucHV0KCkgY2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1EaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcbiAgICBcIldPVUxEX19ZT1VfTElLRV9UT19ERUxFVEVfVEhJU19DT05WRVJTQVRJT05cIlxuICApO1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSBuZXcgQ29uZmlybURpYWxvZ1N0eWxlKHtcbiAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjpcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICksXG4gICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoXCJkYXJrXCIpLFxuICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICksXG4gICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH0pO1xuICBASW5wdXQoKSBiYWNrZHJvcFN0eWxlOiBCYWNrZHJvcFN0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiYSgwLCAwLCAwLCAwLjUpXCIsXG4gICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgfTtcbiAgQElucHV0KCkgYmFkZ2VTdHlsZTogQmFkZ2VTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNXB4XCIsXG4gICAgaGVpZ2h0OiBcIjE1cHhcIixcbiAgICBiYWNrZ3JvdW5kOiBcIiM1YWFlZmZcIixcbiAgICB0ZXh0Q29sb3I6IFwid2hpdGVcIixcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTNweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIGRhdGVTdHlsZTogRGF0ZVN0eWxlID0ge1xuICAgIHRleHRGb250OiBcIjQwMCAxMXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGV4dENvbG9yOiBcInJnYmEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgfTtcbiAgQElucHV0KCkgY29udmVyc2F0aW9uc1N0eWxlOiBDb252ZXJzYXRpb25zU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiXCIsXG4gIH07XG4gIEBJbnB1dCgpIGxpc3RJdGVtU3R5bGU6IExpc3RJdGVtU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgc3RhdHVzSW5kaWNhdG9yU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMTBweFwiLFxuICAgIHdpZHRoOiBcIjEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSB0eXBpbmdJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIklTX1RZUElOR1wiKTtcbiAgQElucHV0KCkgdGhyZWFkSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJTl9BX1RIUkVBRFwiKTtcbiAgQElucHV0KCkgYXZhdGFyU3R5bGU6IEF2YXRhclN0eWxlID0ge307XG4gIEBJbnB1dCgpIHJlY2VpcHRTdHlsZTogUmVjZWlwdFN0eWxlID0ge307XG4gIGNjR3JvdXBNZW1iZXJBZGRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckpvaW5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlcktpY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlckJhbm5lZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NPd25lcnNoaXBDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VTZW50ITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZURlbGV0ZSE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cERlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBMZWZ0ITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJCbG9ja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY1VzZXJVbmJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG5cbiAgY2NNZXNzYWdlUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lZGlhTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25Gb3JtTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DYXJkTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc1JlYWRCeUFsbCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VFZGl0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZXNEZWxpdmVyZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nU3RhcnRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjT3V0Z29pbmdDYWxsITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsUmVqZWN0ZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxFbmRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEFjY2VwdGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NHcm91cENyZWF0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGljb25TdHlsZTogYW55ID0ge1xuICAgIGljb25UaW50OiBcImxpZ2h0Z3JleVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgd2lkdGg6IFwiMjBweFwiLFxuICB9O1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IG5ldyBMaXN0U3R5bGUoe30pO1xuICBtZW51c3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBpY29uVGludDogXCJncmV5XCIsXG4gICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBpY29uQm9yZGVyOiBcIm5vbmVcIixcbiAgICBpY29uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiNzBweFwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMjBweFwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gIH07XG4gIHB1YmxpYyB0eXBpbmdJbmRpY2F0b3IhOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yIHwgbnVsbDtcbiAgcHVibGljIHR5cGluZ0xpc3RlbmVySWQ6IHN0cmluZyA9XG4gICAgXCJjb252ZXJzYXRpb25fX0xJU1RFTkVSXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgaXNEaWFsb2dPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0VtcHR5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiXCIsXG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiLFxuICB9O1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW107XG4gIHB1YmxpYyBzY3JvbGxlZFRvQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjaGVja0l0ZW1DaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29udmVyc2F0aW9uT3B0aW9ucyE6IENvbWV0Q2hhdE9wdGlvbltdO1xuICBwdWJsaWMgc2hvd0NvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblRvQmVEZWxldGVkOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF91c2VyX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBncm91cExpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2hhdGxpc3RfZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwVG9VcGRhdGU6IENvbWV0Q2hhdC5Hcm91cCB8IHt9ID0ge307XG4gIHB1YmxpYyBjb252ZXJzYXRpb25UeXBlPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuICBzYWZlSHRtbCE6IFNhZmVIdG1sO1xuICBlbmFibGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVTdGlja2VyczogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVXaGl0ZWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZURvY3VtZW50OiBib29sZWFuID0gZmFsc2U7XG4gIHRocmVhZEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3RocmVhZC1hcnJvdy5zdmdcIjtcbiAgcHVibGljIGNvbmZpcm1EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgfTtcbiAgc3VidGl0bGVWYWx1ZSE6IHN0cmluZztcbiAgbW9kYWxTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgIGhlaWdodDogXCIyMzBweFwiLFxuICAgIHdpZHRoOiBcIjI3MHB4XCIsXG4gIH07XG4gIGZpcnN0UmVsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzQWN0aXZlOiBib29sZWFuID0gdHJ1ZTtcbiAgY29udGFjdHNOb3RGb3VuZDogYm9vbGVhbiA9IGZhbHNlO1xuICBjaGF0U2VhcmNoITogYm9vbGVhbjtcbiAgcmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3Q7XG4gIGNoZWNrYm94U3R5bGU6IENoZWNrYm94U3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiNHB4XCIsXG4gICAgY2hlY2tlZEJhY2tncm91bmRDb2xvcjogXCIjMjE5NkYzXCIsXG4gICAgdW5jaGVja2VkQmFja2dyb3VuZENvbG9yOiBcIiNjY2NcIlxuICB9XG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIHB1YmxpYyBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0aWVzIHdpbGwgY29tZSBmcm9tIFBhcmVudC5cbiAgICovXG4gIEBJbnB1dCgpIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgLy9UbyBiZSBlbmFibGVkIGluIFVNQ1xuICAvLyBASW5wdXQoKSBtZW50aW9uc0ljb25VUkwhOiBzdHJpbmc7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+O1xuXG4gIC8qKlxuICAgKiBQcm9wZXJ0aWVzIGZvciBpbnRlcm5hbCB1c2VcbiAgICovXG4gIC8qKlxuICAgKiBwYXNzaW5nIHRoaXMgY2FsbGJhY2sgdG8gbWVudUxpc3QgY29tcG9uZW50IG9uIGRlbGV0ZSBjbGlja1xuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIGRlbGV0ZUNvbnZlcnNhdGlvbk9uQ2xpY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q29uZmlybWF0aW9uRGlhbG9nKHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQhKTtcbiAgfTtcbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25Db25maXJtQ2xpY2sgPSAoKSA9PiB7XG4gICAgdGhpcy5kZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpO1xuICB9O1xuICBvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiwgZXZlbnQ6IGFueSkge1xuICAgIGxldCBzZWxlY3RlZDogYm9vbGVhbiA9IGV2ZW50LmRldGFpbC5jaGVja2VkO1xuICAgIGlmICh0aGlzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLm9uU2VsZWN0KGNvbnZlcnNhdGlvbiwgc2VsZWN0ZWQpO1xuICAgIH1cbiAgfVxuICBnZXRTdGF0dXNJbmRpY2F0b3JTdHlsZSA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBjb25zdCBjb252V2l0aCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCk7XG5cbiAgICBpZiAoY29udldpdGggaW5zdGFuY2VvZiBDb21ldENoYXQuVXNlcikge1xuICAgICAgbGV0IHVzZXJTdGF0dXNWaXNpYmlsaXR5ID0gbmV3IE1lc3NhZ2VVdGlscygpLmdldFVzZXJTdGF0dXNWaXNpYmlsaXR5KGNvbnZXaXRoKTtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAhdXNlclN0YXR1c1Zpc2liaWxpdHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0TWVudGlvbkljb25TdHlsZSgpOiBJY29uU3R5bGUge1xuICAvLyAgIHJldHVybiBuZXcgSWNvblN0eWxlKHtcbiAgLy8gICAgIGhlaWdodDogXCIxNnB4XCIsXG4gIC8vICAgICB3aWR0aDogXCIxNnB4XCIsXG4gIC8vICAgICBpY29uVGludDpcbiAgLy8gICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5tZW50aW9uSWNvblRpbnQgPz9cbiAgLy8gICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAvLyAgIH0pO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKClcbiAgICBpZiAoXG4gICAgICBpdGVtIGluc3RhbmNlb2YgQ29tZXRDaGF0LlVzZXJcbiAgICApIHtcbiAgICAgIGxldCB1c2VyU3RhdHVzVmlzaWJpbGl0eSA9IG5ldyBNZXNzYWdlVXRpbHMoKS5nZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShpdGVtKSB8fCB0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlO1xuICAgICAgaWYgKCF1c2VyU3RhdHVzVmlzaWJpbGl0eSlcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzQ29sb3JbaXRlbT8uZ2V0U3RhdHVzKCldO1xuICAgICAgZWxzZSByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0dXNDb2xvcltpdGVtPy5nZXRUeXBlKCldXG4gICAgfVxuICB9XG5cbiAgZ2V0RXh0ZW5zaW9uRGF0YShtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBsZXQgbWVzc2FnZVRleHQ7XG4gICAgLy94c3MgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgeHNzRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInhzcy1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgeHNzRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJzYW5pdGl6ZWRfdGV4dFwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoeHNzRGF0YSwgXCJoYXNYU1NcIikgJiZcbiAgICAgIHhzc0RhdGEuaGFzWFNTID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHhzc0RhdGEuc2FuaXRpemVkX3RleHQ7XG4gICAgfVxuICAgIC8vZGF0YW1hc2tpbmcgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgbWFza2VkRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcImRhdGEtbWFza2luZ1wiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICBtYXNrZWREYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShtYXNrZWREYXRhLCBcImRhdGFcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICBtYXNrZWREYXRhLmRhdGEsXG4gICAgICAgIFwic2Vuc2l0aXZlX2RhdGFcIlxuICAgICAgKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgIG1hc2tlZERhdGEuZGF0YSxcbiAgICAgICAgXCJtZXNzYWdlX21hc2tlZFwiXG4gICAgICApICYmXG4gICAgICBtYXNrZWREYXRhLmRhdGEuc2Vuc2l0aXZlX2RhdGEgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0gbWFza2VkRGF0YS5kYXRhLm1lc3NhZ2VfbWFza2VkO1xuICAgIH1cbiAgICAvL3Byb2Zhbml0eSBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCBwcm9mYW5lRGF0YSA9IENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja01lc3NhZ2VGb3JFeHRlbnNpb25zRGF0YShcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICBcInByb2Zhbml0eS1maWx0ZXJcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgcHJvZmFuZURhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHByb2ZhbmVEYXRhLCBcInByb2Zhbml0eVwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkocHJvZmFuZURhdGEsIFwibWVzc2FnZV9jbGVhblwiKSAmJlxuICAgICAgcHJvZmFuZURhdGEucHJvZmFuaXR5ID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IHByb2ZhbmVEYXRhLm1lc3NhZ2VfY2xlYW47XG4gICAgfVxuICAgIHJldHVybiBtZXNzYWdlVGV4dCB8fCAobWVzc2FnZU9iamVjdCBhcyBhbnkpLnRleHQ7XG4gIH1cbiAgc2V0U3VidGl0bGUgPSAoY29udmVyc2F0aW9uT2JqZWN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgY29uc3QgbGFzdE1lc3NhZ2UgPSBjb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICBpZihsYXN0TWVzc2FnZSAmJiBsYXN0TWVzc2FnZT8uZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCl7XG4gICAgICBsYXN0TWVzc2FnZS5zZXRUZXh0KHByb2Nlc3NTdWJ0aXRsZUNvbnRlbnQoKGxhc3RNZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0VGV4dCgpKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnR5cGluZ0luZGljYXRvcikge1xuICAgICAgY29uc3QgaXNUeXBpbmcgPVxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/Lmd1aWQgPT1cbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgaWYgKGlzVHlwaW5nKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnR5cGluZ0luZGljYXRvci5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICR7dGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0XG4gICAgICAgICAgfWA7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/LnVpZCA9PVxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvcj8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJUeXBlKCkgIT09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3VidGl0bGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRMYXN0Q29udmVyc2F0aW9uTWVzc2FnZShcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdCxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyISxcblxuICAgICAge1xuICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIG1lbnRpb25zVGFyZ2V0RWxlbWVudDogTWVudGlvbnNUYXJnZXRFbGVtZW50LmNvbnZlcnNhdGlvbixcbiAgICAgICAgdGV4dEZvcm1hdHRlcnM6IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICAgIH1cbiAgICApO1xuICAgIGxldCBpY29uID1cbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0VHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICA/IFwi8J+TniBcIlxuICAgICAgICA6IFwi8J+TuSBcIjtcblxuICAgIHJldHVybiB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0SHRtbChcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0Q2F0ZWdvcnkoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbFxuICAgICAgICA/IGljb24gKyBzdWJ0aXRsZVxuICAgICAgICA6IHN1YnRpdGxlXG4gICAgKTtcbiAgfTtcblxuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIGdldFVucmVhZE1lbnRpb25zSWNvblN0eWxlKCkge1xuICAvLyAgIHJldHVybiB7XG4gIC8vICAgICBwYWRkaW5nUmlnaHQ6IFwiM3B4XCIsXG4gIC8vICAgfTtcbiAgLy8gfVxuXG4gIGNoZWNrR3JvdXBUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbik6IHN0cmluZyB7XG4gICAgbGV0IGltYWdlOiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApIHtcbiAgICAgIGxldCBncm91cDogQ29tZXRDaGF0Lkdyb3VwID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXA7XG4gICAgICBzd2l0Y2ggKGdyb3VwLmdldFR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnBhc3N3b3JkR3JvdXBJY29uIHx8IHRoaXMucHJvdGVjdGVkR3JvdXBJY29uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucHJpdmF0ZTpcbiAgICAgICAgICBpbWFnZSA9IHRoaXMucHJpdmF0ZUdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpbWFnZSA9IFwiXCI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbWFnZTtcbiAgfVxuICAvLyBjYWxsYmFjayBmb3IgY29uZmlybURpYWxvZ0NvbXBvbmVudFxuICBvbkNhbmNlbENsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMuaXNEaWFsb2dPcGVuID0gZmFsc2U7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IG51bGw7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBnZXRNZXNzYWdlUmVjZWlwdCA9IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBsZXQgcmVjZWlwdCA9IE1lc3NhZ2VSZWNlaXB0VXRpbHMuZ2V0UmVjZWlwdFN0YXR1cyhcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpXG4gICAgKTtcbiAgICByZXR1cm4gcmVjZWlwdDtcbiAgfTtcbiAgZ2V0RGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRlUGF0dGVybiA/PyBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIH1cbiAgb3B0aW9uc1N0eWxlID0ge1xuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSByZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBDb21ldENoYXRUaGVtZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSBzYW5pdGl6ZXI6IERvbVNhbml0aXplclxuICApIHsgfVxuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuZmlyc3RSZWxvYWQgPSB0cnVlO1xuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIpIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyID1cbiAgICAgICAgbmV3IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIoKVxuICAgICAgICAgIC5zZXRMaW1pdCh0aGlzLmxpbWl0KVxuICAgIH1cbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbk9wdGlvbnMoKTtcbiAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5hdHRhY2hMaXN0ZW5lcnModGhpcy5jb252ZXJzYXRpb25VcGRhdGVkKTtcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKTtcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlcj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oKTtcbiAgfVxuICAvKipcbiAgKiBEZXRlcm1pbmVzIGlmIHRoZSBsYXN0IG1lc3NhZ2Ugc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlIGJhc2VkIG9uIGl0cyBjYXRlZ29yeSBhbmQgdHlwZS5cbiAgKlxuICAqIEBwYXJhbSBtZXNzYWdlIC0gVGhlIGxhc3QgbWVzc2FnZSBzZW50IG9yIHJlY2VpdmVkIGluIHRoZSBjb252ZXJzYXRpb24uXG4gICogQHJldHVybnMge2Jvb2xlYW59IC0gUmV0dXJucyB0cnVlIGlmIHRoZSBtZXNzYWdlIHNob3VsZCB0cmlnZ2VyIGFuIHVwZGF0ZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAqL1xuICBjaGVja0lmTGFzdE1lc3NhZ2VTaG91bGRVcGRhdGUobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuY29udmVyc2F0aW9uVHlwZSAmJiB0aGlzLmNvbnZlcnNhdGlvblR5cGUgIT0gbWVzc2FnZS5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBDaGVja2luZyBpZiB0aGUgbWVzc2FnZSBpcyBhIGN1c3RvbSBtZXNzYWdlXG4gICAgbGV0IGlzQ3VzdG9tTWVzc2FnZSA9IG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jdXN0b21cbiAgICAvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBpcyBhIHJlcGx5IHRvIGFub3RoZXIgbWVzc2FnZVxuICAgIGlmIChtZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKSAmJiAhQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uTWVzc2FnZVJlcGxpZXMoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXNDdXN0b21NZXNzYWdlKSB7XG4gICAgICBpZiAobWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKCkgJiYgQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uTWVzc2FnZVJlcGxpZXMoKSAmJiB0aGlzLnNob3VsZEluY3JlbWVudEZvckN1c3RvbU1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnNob3VsZEluY3JlbWVudEZvckN1c3RvbU1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSk7XG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGFuIGFjdGlvbiBtZXNzYWdlXG4gICAgaWYgKG1lc3NhZ2U/LmdldENhdGVnb3J5KCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24pIHtcbiAgICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgZ3JvdXAgbWVtYmVyIGFjdGlvblxuICAgICAgaWYgKG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyKSB7XG4gICAgICAgIHJldHVybiBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25Hcm91cEFjdGlvbnMoKTtcbiAgICAgIH1cbiAgICAgIC8vIEJ5IGRlZmF1bHQsIGFjdGlvbiBtZXNzYWdlcyBzaG91bGQgdHJpZ2dlciBhbiB1cGRhdGVcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIC8vIENoZWNrIGlmIHRoZSBtZXNzYWdlIGlzIGEgY2FsbCAoZWl0aGVyIGF1ZGlvIG9yIHZpZGVvKVxuICAgIGlmIChtZXNzYWdlPy5nZXRDYXRlZ29yeSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCAmJlxuICAgICAgKG1lc3NhZ2U/LmdldFR5cGUoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvIHx8XG4gICAgICAgIG1lc3NhZ2UuZ2V0VHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8pKSB7XG4gICAgICByZXR1cm4gQ29tZXRDaGF0VUlLaXQuY29udmVyc2F0aW9uVXBkYXRlU2V0dGluZ3M/LnNob3VsZFVwZGF0ZU9uQ2FsbEFjdGl2aXRpZXMoKTtcbiAgICB9XG4gICAgLy8gQnkgZGVmYXVsdCwgbWVzc2FnZXMgc2hvdWxkIHRyaWdnZXIgYW4gdXBkYXRlXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgc2hvdWxkSW5jcmVtZW50Rm9yQ3VzdG9tTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZSkge1xuICAgIGNvbnN0IG1ldGFkYXRhOiBhbnkgPSBtZXNzYWdlLmdldE1ldGFkYXRhKCk7XG4gICAgLy8gQ2hlY2tpbmcgaWYgdGhlIGN1c3RvbSBtZXNzYWdlIHNob3VsZCBpbmNyZW1lbnQgdGhlIHVucmVhZCBtZXNzYWdlIGNvdW50ZXJcbiAgICByZXR1cm4gbWVzc2FnZS53aWxsVXBkYXRlQ29udmVyc2F0aW9uKClcbiAgICAgIHx8IChtZXRhZGF0YSAmJiBtZXRhZGF0YS5oYXNPd25Qcm9wZXJ0eShcImluY3JlbWVudFVucmVhZENvdW50XCIpICYmIG1ldGFkYXRhLmluY3JlbWVudFVucmVhZENvdW50KSB8fCBDb21ldENoYXRVSUtpdC5jb252ZXJzYXRpb25VcGRhdGVTZXR0aW5ncz8uc2hvdWxkVXBkYXRlT25DdXN0b21NZXNzYWdlcygpO1xuICB9XG4gIGF0dGFjaENvbm5lY3Rpb25MaXN0ZW5lcnMoKSB7XG4gICAgQ29tZXRDaGF0LmFkZENvbm5lY3Rpb25MaXN0ZW5lcihcbiAgICAgIHRoaXMuY29ubmVjdGlvbkxpc3RlbmVySWQsXG4gICAgICBuZXcgQ29tZXRDaGF0LkNvbm5lY3Rpb25MaXN0ZW5lcih7XG4gICAgICAgIG9uQ29ubmVjdGVkOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT5jb25uZWN0ZWRcIik7XG4gICAgICAgICAgdGhpcy5mZXRjaE5ld0NvbnZlcnNhdGlvbnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5Db25uZWN0aW5nOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDb25uZWN0aW9uTGlzdGVuZXIgPT4gSW4gY29ubmVjdGluZ1wiKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25EaXNjb25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBPbiBEaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG4gIH1cbiAgdXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmIChjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKSAmJiB0aGlzLmNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKSkpIHtcbiAgICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEsIGNvbnZlcnNhdGlvbik7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQgPVxuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS5ncm91cCEpO1xuICAgICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJBZGRlZCkgPT4ge1xuICAgICAgICAgIGxldCBncm91cDogQ29tZXRDaGF0Lkdyb3VwID0gaXRlbS51c2VyQWRkZWRJbiE7XG4gICAgICAgICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb25bXSA9IGl0ZW0ubWVzc2FnZXMhO1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0udXNlckFkZGVkSW4hKTtcbiAgICAgICAgICBjb252ZXJzYXRpb24/LnNldENvbnZlcnNhdGlvbldpdGgoZ3JvdXApO1xuICAgICAgICAgIGNvbnZlcnNhdGlvbj8uc2V0TGFzdE1lc3NhZ2UoYWN0aW9uTWVzc2FnZVthY3Rpb25NZXNzYWdlPy5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uISk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQgPVxuICAgICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZShcbiAgICAgICAgICAoaXRlbTogSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS5raWNrZWRGcm9tISk7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRMYXN0TWVzc2FnZShpdGVtLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICAgIENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJCYW5uZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChpdGVtOiBJR3JvdXBNZW1iZXJLaWNrZWRCYW5uZWQpID0+IHtcbiAgICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwRGVsZXRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBEZWxldGVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IENvbWV0Q2hhdC5Hcm91cCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbUdyb3VwKGl0ZW0pO1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5jY0dyb3VwTGVmdCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBMZWZ0LnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cExlZnQpID0+IHtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgICAgIGM/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAgICAgICAoYz8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09XG4gICAgICAgICAgICAgIGl0ZW0ubGVmdEdyb3VwLmdldEd1aWQoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSB7XG4gICAgICB0aGlzLmNjVXNlckJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlckJsb2NrZWQuc3Vic2NyaWJlKFxuICAgICAgICAoaXRlbTogQ29tZXRDaGF0LlVzZXIpID0+IHtcbiAgICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Vc2VyKGl0ZW0pO1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb24gJiYgIXRoaXMucmVxdWVzdEJ1aWxkZXI/LmlzSW5jbHVkZUJsb2NrZWRVc2VycygpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVXNlcihpdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5jY1VzZXJVbmJsb2NrZWQgPSBDb21ldENoYXRVc2VyRXZlbnRzLmNjVXNlclVuYmxvY2tlZC5zdWJzY3JpYmUoXG4gICAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uRnJvbVVzZXIoaXRlbSk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbiAmJiB0aGlzLnJlcXVlc3RCdWlsZGVyPy5pc0luY2x1ZGVCbG9ja2VkVXNlcnMoKSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG9iamVjdDogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBvYmplY3Q/Lm1lc3NhZ2U/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG9iamVjdC5tZXNzYWdlITtcbiAgICAgICAgICBpZiAob2JqZWN0LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5zdWJzY3JpYmUoXG4gICAgICAob2JqOiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG9iai5tZXNzYWdlITtcbiAgICAgICAgaWYgKG9iai5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5zdWNjZXNzKSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZSA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2VPYmplY3QpO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVJlYWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tSWQobWVzc2FnZU9iamVjdC5nZXRDb252ZXJzYXRpb25JZCgpKTtcbiAgICAgICAgaWYoY29udmVyc2F0aW9uKXtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UoY29udmVyc2F0aW9uLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICB0aGlzLnJlc2V0VW5yZWFkQ291bnQoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZU9iamVjdC5nZXRSZWNlaXZlclR5cGUoKSkge1xuICAgICAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIuZ2V0Q29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0XG4gICAgICAgICAgKS50aGVuKChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlT2JqZWN0IGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICAgICAgICAgIHRoaXMucmVzZXRVbnJlYWRDb3VudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjR3JvdXBDcmVhdGVkID0gQ29tZXRDaGF0R3JvdXBFdmVudHMuY2NHcm91cENyZWF0ZWQuc3Vic2NyaWJlKFxuICAgICAgKGdyb3VwOiBDb21ldENoYXQuR3JvdXApID0+IHtcbiAgICAgICAgIENvbWV0Q2hhdC5nZXRDb252ZXJzYXRpb24oZ3JvdXAuZ2V0R3VpZCgpLENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApLnRoZW4oKGNvbnZlcnNhdGlvbjpDb21ldENoYXQuQ29udmVyc2F0aW9uKT0+e1xuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0LnVuc2hpZnQoY29udmVyc2F0aW9uKTtcbiAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgIH0pXG4gICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJLaWNrZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwTWVtYmVyQmFubmVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGU/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBMZWZ0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NVc2VyQmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjVXNlclVuYmxvY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZVJlYWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY0dyb3VwQ3JlYXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT1cbiAgICAgICAgdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tSWQoaWQ6IHN0cmluZykge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25JZCgpID09IGlkXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udmVyc2F0aW9uTGlzdFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldENvbnZlcnNhdGlvbkZyb21Hcm91cChcbiAgICBncm91cDogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGVsZW1lbnQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgKGVsZW1lbnQuZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09XG4gICAgICAgIGdyb3VwLmdldEd1aWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2U6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKGNoYW5nZVtcImFjdGl2ZUNvbnZlcnNhdGlvblwiXSkge1xuICAgICAgICB0aGlzLnJlc2V0VW5yZWFkQ291bnQoKTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgaWYgKGNoYW5nZVtcImNvbnZlcnNhdGlvbnNTdHlsZVwiXSkge1xuICAgICAgICB0aGlzLnNldFRoZW1lU3R5bGUoKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogV2hlbiB1c2VyIHNlbmRzIG1lc3NhZ2UgY29udmVyc2F0aW9uTGlzdCBpcyB1cGRhdGVkIHdpdGggbGF0ZXN0IG1lc3NhZ2VcbiAgICAgICAqL1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLy8gZ2V0dGluZyBkZWZhdWx0IGNvbnZlcnNhdGlvbiBvcHRpb24gYW5kIGFkZGluZyBjYWxsYmFjayBpbiBpdFxuICBzZXRDb252ZXJzYXRpb25PcHRpb25zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zID0gQ29udmVyc2F0aW9uVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0T3B0aW9uKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICFlbGVtZW50Lm9uQ2xpY2sgJiZcbiAgICAgICAgZWxlbWVudC5pZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Db252ZXJzYXRpb25PcHRpb25zLmRlbGV0ZVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uT25DbGljaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gcmVzZXQgdW5yZWFkIGNvdW50XG4gIG9uQ2xpY2soY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soY29udmVyc2F0aW9uKTtcbiAgICB9XG4gIH1cbiAgLy8gc2V0IHVucmVhZCBjb3VudFxuICByZXNldFVucmVhZENvdW50KGNvbnZlcnNhdGlvbklkPzogc3RyaW5nKSB7XG4gICAgY29uc3QgdGFyZ2V0Q29udmVyc2F0aW9uSWQgPSBjb252ZXJzYXRpb25JZCB8fCB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKTtcbiAgXG4gICAgaWYgKCF0YXJnZXRDb252ZXJzYXRpb25JZCkgcmV0dXJuO1xuICBcbiAgICBjb25zdCBjb252ZXJzYXRpb25JbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoY29udikgPT4gY29udi5nZXRDb252ZXJzYXRpb25JZCgpID09PSB0YXJnZXRDb252ZXJzYXRpb25JZFxuICAgICk7XG4gIFxuICAgIGlmIChjb252ZXJzYXRpb25JbmRleCA8IDApIHJldHVybjtcbiAgXG4gICAgY29uc3QgdXBkYXRlZENvbnZlcnNhdGlvbiA9IHRoaXMuY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25JbmRleF07XG4gICAgdXBkYXRlZENvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gIFxuICAgIGNvbnN0IGxhc3RNZXNzYWdlID0gdXBkYXRlZENvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuICAgIGlmIChsYXN0TWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkge1xuICAgICAgbGFzdE1lc3NhZ2Uuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgfVxuICBcbiAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbXG4gICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3Quc2xpY2UoMCwgY29udmVyc2F0aW9uSW5kZXgpLFxuICAgICAgdXBkYXRlZENvbnZlcnNhdGlvbixcbiAgICAgIC4uLnRoaXMuY29udmVyc2F0aW9uTGlzdC5zbGljZShjb252ZXJzYXRpb25JbmRleCArIDEpLFxuICAgIF07XG4gIFxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvLyBzZXRzIHByb3BlcnR5IGZyb20gdGhlbWUgdG8gc3R5bGUgb2JqZWN0XG4gIHNldFRoZW1lU3R5bGUoKSB7XG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0QmFkZ2VTdHlsZSgpO1xuICAgIHRoaXMuc2V0Q29uZmlybURpYWxvZ1N0eWxlKCk7XG4gICAgdGhpcy5zZXRDb252ZXJzYXRpb25zU3R5bGUoKTtcbiAgICB0aGlzLnNldExpc3RJdGVtU3R5bGUoKTtcbiAgICB0aGlzLnNldERhdGVTdHlsZSgpO1xuICAgIHRoaXMuc2V0U3RhdHVzU3R5bGUoKTtcbiAgICB0aGlzLnNldFJlY2VpcHRTdHlsZSgpO1xuICAgIHRoaXMuc3RhdHVzQ29sb3IucHJpdmF0ZSA9XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ucHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5vbmxpbmUgPSB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ub25saW5lU3RhdHVzQ29sb3I7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wYXNzd29yZCA9XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ucGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kO1xuICAgIHRoaXMubGlzdFN0eWxlID0ge1xuICAgICAgdGl0bGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudGl0bGVUZXh0Rm9udCxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRDb2xvcixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZW1wdHlTdGF0ZVRleHRGb250LFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZW1wdHlTdGF0ZVRleHRDb2xvcixcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZXJyb3JTdGF0ZVRleHRGb250LFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuZXJyb3JTdGF0ZVRleHRDb2xvcixcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUubG9hZGluZ0ljb25UaW50LFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnNlcGFyYXRvckNvbG9yLFxuICAgIH07XG4gICAgdGhpcy5pY29uU3R5bGUuaWNvblRpbnQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpO1xuICB9XG4gIHNldExpc3RJdGVtU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTGlzdEl0ZW1TdHlsZSA9IG5ldyBMaXN0SXRlbVN0eWxlKHtcbiAgICAgIGhlaWdodDogXCI5NyVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYWN0aXZlQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgaG92ZXJCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgfSk7XG4gICAgdGhpcy5saXN0SXRlbVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMubGlzdEl0ZW1TdHlsZSB9O1xuICB9XG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIzNnB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMzZweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG4gIHNldFN0YXR1c1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICB3aWR0aDogXCIxMnB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICB9O1xuICAgIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLnN0YXR1c0luZGljYXRvclN0eWxlLFxuICAgIH07XG4gIH1cbiAgc2V0Q29udmVyc2F0aW9uc1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbnZlcnNhdGlvbnNTdHlsZSA9IG5ldyBDb252ZXJzYXRpb25zU3R5bGUoe1xuICAgICAgbGFzdE1lc3NhZ2VUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBsYXN0TWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWAsXG4gICAgICB0aXRsZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9ubGluZVN0YXR1c0NvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFN1Y2Nlc3MoKSxcbiAgICAgIHNlcGFyYXRvckNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJpdmF0ZUdyb3VwSWNvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgcGFzc3dvcmRHcm91cEljb25CYWNrZ3JvdW5kOiBcIlJHQigyNDcsIDE2NSwgMClcIixcbiAgICAgIHR5cGluZ0luZGljdG9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHR5cGluZ0luZGljdG9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgdGhyZWFkSW5kaWNhdG9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25zU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5jb252ZXJzYXRpb25zU3R5bGUgfTtcbiAgICB0aGlzLmNoZWNrYm94U3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI0cHhcIixcbiAgICAgIGNoZWNrZWRCYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdW5jaGVja2VkQmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpXG4gICAgfVxuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cbiAgc2V0UmVjZWlwdFN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIlxuICAgIH0pO1xuICAgIHRoaXMucmVjZWlwdFN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMucmVjZWlwdFN0eWxlIH07XG4gIH1cbiAgc2V0QmFkZ2VTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBCYWRnZVN0eWxlID0gbmV3IEJhZGdlU3R5bGUoe1xuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGhlaWdodDogXCIxNnB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuYmFkZ2VTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmJhZGdlU3R5bGUgfTtcbiAgfVxuICBzZXRDb25maXJtRGlhbG9nU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0gbmV3IENvbmZpcm1EaWFsb2dTdHlsZSh7XG4gICAgICBjb25maXJtQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTZWNvbmRhcnkoKSxcbiAgICAgIGNvbmZpcm1CdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwibGlnaHRcIiksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKFwiZGFya1wiKSxcbiAgICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBtZXNzYWdlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgbWVzc2FnZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjM1MHB4XCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5kZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUsXG4gICAgfTtcbiAgfVxuICAvLyBjaGVja2luZyBpZiB1c2VyIGhhcyBoaXMgb3duIGNvbmZpZ3VyYXRpb24gZWxzZSB3aWxsIHVzZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb25cbiAgLyoqXG4gICAqIEBwYXJhbSAge09iamVjdD17fX0gY29uZmlnXG4gICAqIEBwYXJhbSAge09iamVjdH0gZGVmYXVsdENvbmZpZz9cbiAgICogQHJldHVybnMgZGVmYXVsdENvbmZpZ1xuICAgKi9cbiAgLy8gY2FsbGluZyBzdWJ0aXRsZSBjYWxsYmFjayBmcm9tIGNvbmZpZ3VyYXRpb25zXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBjb3ZlcnNhdGlvbiBiYXNlZCBvbiB0aGUgY29udmVyc2F0aW9uUmVxdWVzdCBjb25maWdcbiAgICovXG4gIGZldGNoTmV4dENvbnZlcnNhdGlvbigpOiBhbnkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0QnVpbGRlci5mZXRjaE5leHQoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgdXBkYXRlRWRpdGVkTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgJiZcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBtZXNzYWdlPy5nZXRJZCgpXG4gICAgKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogYXR0YWNoZXMgTGlzdGVuZXJzIGZvciB1c2VyIGFjdGl2aXR5ICwgZ3JvdXAgYWN0aXZpdGllcyBhbmQgY2FsbGluZ1xuICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIGF0dGFjaExpc3RlbmVycyhjYWxsYmFjazogYW55KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlVXNlcnNQcmVzZW5jZSAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyKSkge1xuICAgICAgICBDb21ldENoYXQuYWRkVXNlckxpc3RlbmVyKFxuICAgICAgICAgIHRoaXMudXNlckxpc3RlbmVySWQsXG4gICAgICAgICAgbmV3IENvbWV0Q2hhdC5Vc2VyTGlzdGVuZXIoe1xuICAgICAgICAgICAgb25Vc2VyT25saW5lOiAob25saW5lVXNlcjogb2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAgIC8qIHdoZW4gc29tZXVzZXIvZnJpZW5kIGNvbWVzIG9ubGluZSwgdXNlciB3aWxsIGJlIHJlY2VpdmVkIGhlcmUgKi9cbiAgICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub25saW5lLFxuICAgICAgICAgICAgICAgIG9ubGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblVzZXJPZmZsaW5lOiAob2ZmbGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCB3ZW50IG9mZmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9mZmxpbmUsXG4gICAgICAgICAgICAgICAgb2ZmbGluZVVzZXJcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICAgIENvbWV0Q2hhdC5hZGRHcm91cExpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuZ3JvdXBMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZFVzZXI6IGFueSxcbiAgICAgICAgICAgICAgbmV3U2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgb2xkU2NvcGU6IGFueSxcbiAgICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyS2lja2VkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAga2lja2VkVXNlcjogYW55LFxuICAgICAgICAgICAgICBraWNrZWRCeTogYW55LFxuICAgICAgICAgICAgICBraWNrZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBraWNrZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShraWNrZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkdyb3VwTWVtYmVyQmFubmVkOiAoXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgICAgYmFubmVkVXNlcjogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRCeTogYW55LFxuICAgICAgICAgICAgICBiYW5uZWRGcm9tOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09PSBiYW5uZWRVc2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShiYW5uZWRGcm9tKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICB1c2VyQWRkZWQ6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkQnk6IGFueSxcbiAgICAgICAgICAgICAgdXNlckFkZGVkSW46IGFueVxuICAgICAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJMZWZ0OiAobWVzc2FnZTogYW55LCBsZWF2aW5nVXNlcjogYW55LCBncm91cDogYW55KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uR3JvdXBNZW1iZXJKb2luZWQ6IChcbiAgICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgICBqb2luZWRVc2VyOiBhbnksXG4gICAgICAgICAgICAgIGpvaW5lZEdyb3VwOiBhbnlcbiAgICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5hZGRDYWxsTGlzdGVuZXIoXG4gICAgICAgIHRoaXMuY2FsbExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuQ2FsbExpc3RlbmVyKHtcbiAgICAgICAgICBvbkluY29taW5nQ2FsbFJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxDYW5jZWxsZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbk91dGdvaW5nQ2FsbFJlamVjdGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxBY2NlcHRlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FsbEVuZGVkTWVzc2FnZVJlY2VpdmVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICAvLyBTREsgbGlzdGVuZXJzXG4gICAgICB0aGlzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UZXh0TWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAodGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgdGV4dE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAobWVkaWFNZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgbWVkaWFNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuQ1VTVE9NX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uRm9ybU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBGb3JtTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGZvcm1NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoZm9ybU1lc3NhZ2U6IFNjaGVkdWxlck1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DYXJkTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY2FyZE1lc3NhZ2U6IENhcmRNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY2FyZE1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkLnN1YnNjcmliZShcbiAgICAgICAgICAoY3VzdG9tTWVzc2FnZTogQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgY3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzUmVhZC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJiAoIXRoaXMuY29udmVyc2F0aW9uVHlwZSB8fCB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPT0gbWVzc2FnZVJlY2VpcHQuZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtBc1JlYWQobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc1JlYWRCeUFsbCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWRCeUFsbC5zdWJzY3JpYmUoXG4gICAgICAgIChtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0ICYmIG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0LmdldFJlY2VpdmVyVHlwZSgpKSkge1xuICAgICAgICAgICAgdGhpcy5tYXJrQXNSZWFkKG1lc3NhZ2VSZWNlaXB0KTtcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VzRGVsaXZlcmVkVG9BbGwuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiBtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSBtZXNzYWdlUmVjZWlwdD8uZ2V0UmVjZWl2ZXJUeXBlKCkpKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQpO1xuXG5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCAmJiBtZXNzYWdlUmVjZWlwdC5nZXRSZWNlaXZlclR5cGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiYgKCF0aGlzLmNvbnZlcnNhdGlvblR5cGUgfHwgdGhpcy5jb252ZXJzYXRpb25UeXBlID09IG1lc3NhZ2VSZWNlaXB0Py5nZXRSZWNlaXZlclR5cGUoKSkpIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWxpdmVyZWRNZXNzYWdlKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdTdGFydGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZykge1xuICAgICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IHR5cGluZ0luZGljYXRvcjtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5vblR5cGluZ0VuZGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ0VuZGVkLnN1YnNjcmliZShcbiAgICAgICAgKHR5cGluZ0luZGljYXRvcjogQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcikgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5jb252ZXJzYXRpb25UeXBlIHx8IHRoaXMuY29udmVyc2F0aW9uVHlwZSA9PSB0eXBpbmdJbmRpY2F0b3I/LmdldFJlY2VpdmVyVHlwZSgpKSB7XG4gICAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZldGNoTmV3Q29udmVyc2F0aW9ucygpIHtcbiAgICB0aGlzLnJlcXVlc3RCdWlsZGVyID0gdGhpcy5jb252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXIuYnVpbGQoKTtcbiAgICBpZiAodGhpcy5yZXF1ZXN0QnVpbGRlcj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLnJlcXVlc3RCdWlsZGVyLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW107XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oU3RhdGVzLmxvYWRlZCk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoZ3JvdXApXG4gICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbilcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZFRvQWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZEJ5QWxsPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VFZGl0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uTWVzc2FnZXNEZWxpdmVyZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nU3RhcnRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEZldGNoZXMgQ29udmVyc2F0aW9ucyBEZXRhaWxzIHdpdGggYWxsIHRoZSB1c2Vyc1xuICAgKi9cbiAgZ2V0Q29udmVyc2F0aW9uID0gKHN0YXRlczogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmcpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnJlcXVlc3RCdWlsZGVyICYmXG4gICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24gJiZcbiAgICAgICgodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24uY3VycmVudF9wYWdlID09IDAgfHxcbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSAhPVxuICAgICAgICAodGhpcy5yZXF1ZXN0QnVpbGRlciBhcyBhbnkpLnBhZ2luYXRpb24udG90YWxfcGFnZXMpXG4gICAgKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGVzO1xuICAgICAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgICAgICB0aGlzLmZldGNoTmV4dENvbnZlcnNhdGlvbigpXG4gICAgICAgICAgICAgIC50aGVuKChjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10pID0+IHtcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LmZvckVhY2goXG4gICAgICAgICAgICAgICAgICAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKClcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnZlcnNhdGlvbi5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVzID09IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW1xuICAgICAgICAgICAgICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICAgIC4uLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QubGVuZ3RoIDw9IDAgJiZcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDBcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5lbXB0eSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZW1wdHk7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGFjaCgpOyAvLyBEZXRhY2ggdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gU3RhdGVzLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maXJzdFJlbG9hZCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hDb25uZWN0aW9uTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmZpcnN0UmVsb2FkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29udmVyc2F0aW9uTGlzdD8ubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIGlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IGl0ZW06IGFueSA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCk7XG4gICAgbGV0IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IGNvbnZlcnNhdGlvbi5nZXRMYXN0TWVzc2FnZSgpO1xuICAgIGlmIChcbiAgICAgICEodGhpcy5kaXNhYmxlUmVjZWlwdCB8fCB0aGlzLmhpZGVSZWNlaXB0KSAmJlxuICAgICAgbWVzc2FnZSAmJlxuICAgICAgIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAoIXRoaXMudHlwaW5nSW5kaWNhdG9yIHx8XG4gICAgICAgIChpdGVtPy51aWQgIT0gdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpICYmXG4gICAgICAgICAgaXRlbT8uZ3VpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udmVyc2F0aW9uIGxpc3QncyBsYXN0IG1lc3NhZ2UgLCBiYWRnZUNvdW50ICwgdXNlciBwcmVzZW5jZSBiYXNlZCBvbiBhY3Rpdml0aWVzIHByb3BhZ2F0ZWQgYnkgbGlzdGVuZXJzXG4gICAqL1xuICBjb252ZXJzYXRpb25VcGRhdGVkID0gKFxuICAgIGtleTogYW55LFxuICAgIGl0ZW06IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG9wdGlvbnMgPSBudWxsXG4gICkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRTpcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQ6XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFya01lc3NhZ2VBc0RlbGl2ZXJlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGlmICghbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpICYmICBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpICE9PSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgJiZcbiAgICAgICghdGhpcy5kaXNhYmxlUmVjZWlwdCB8fCB0aGlzLmhpZGVSZWNlaXB0KSAmJiAgKCF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fCB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKSAhPSBtZXNzYWdlLmdldENvbnZlcnNhdGlvbklkKCkpKSB7XG4gICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gcmVhZE1lc3NhZ2VcbiAgICovXG4gIGdldFVpbnggPSAoKSA9PiB7XG4gICAgcmV0dXJuIFN0cmluZyhNYXRoLnJvdW5kKCtuZXcgRGF0ZSgpIC8gMTAwMCkpO1xuICB9O1xuICBtYXJrQXNSZWFkKHJlYWRNZXNzYWdlOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpIHtcbiAgICBsZXQgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gWy4uLnRoaXMuY29udmVyc2F0aW9uTGlzdF07XG4gICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICk/LmdldElkKCkgPT0gTnVtYmVyKHJlYWRNZXNzYWdlLmdldE1lc3NhZ2VJZCgpKSAmJiAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICkuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgKTtcbiAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmplY3QhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbXG4gICAgICAgICAgICBjb252ZXJzYXRpb25LZXlcbiAgICAgICAgICBdLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuZ2V0UmVhZEF0KClcbiAgICAgICkge1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QgPSBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIChcbiAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXRSZWFkQXQocmVhZE1lc3NhZ2UuZ2V0UmVhZEF0KCkpO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3Quc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAoXG4gICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqZWN0KTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIERldGFpbCB3aGVuIHVzZXIgY29tZXMgb25saW5lL29mZmxpbmVcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ8Q29tZXRDaGF0Lkdyb3VwfG51bGx9IHVzZXJcbiAgICovXG4gIHVwZGF0ZVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAgfCBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vd2hlbiB1c2VyIHVwZGF0ZXNcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbmxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFtcbiAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgXTtcbiAgICAgIC8vR2V0cyB0aGUgaW5kZXggb2YgdXNlciB3aGljaCBjb21lcyBvZmZsaW5lL29ubGluZVxuICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT09XG4gICAgICAgICAgKHVzZXIgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbldpdGhPYmo6IENvbWV0Q2hhdC5Vc2VyID1cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoT2JqLnNldFN0YXR1cygodXNlciBhcyBDb21ldENoYXQuVXNlcikuZ2V0U3RhdHVzKCkpO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0Q29udmVyc2F0aW9uV2l0aChjb252ZXJzYXRpb25XaXRoT2JqKTtcbiAgICAgICAgKG5ld0NvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbmxpc3Q7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgdGhlIGxhc3QgbWVzc2FnZVxuICAgKiBAcGFyYW0gY29udmVyc2F0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0aW9uXG4gICAqL1xuICBtYWtlTGFzdE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IHt9ID0ge31cbiAgKSB7XG4gICAgY29uc3QgbmV3TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgcmV0dXJuIG5ld01lc3NhZ2U7XG4gIH1cbiAgdXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmIChtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG5cbiAgICAgIGNvbnN0IGlzU2FtZUdyb3VwID0gKG1lc3NhZ2UuZ2V0UmVjZWl2ZXIoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PT1cbiAgICAgICAgKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCk7XG5cbiAgICAgIGlmIChpc1NhbWVHcm91cCkge1xuICAgICAgICBsZXQgdXBkYXRlZEdyb3VwID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXA7XG4gICAgICAgIHVwZGF0ZWRHcm91cC5zZXRNZW1iZXJzQ291bnQoKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRNZW1iZXJzQ291bnQoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbi5zZXRDb252ZXJzYXRpb25XaXRoKHVwZGF0ZWRHcm91cCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBVcGRhdGVzIENvbnZlcnNhdGlvbnMgYXMgVGV4dC9DdXN0b20gTWVzc2FnZXMgYXJlIHJlY2VpdmVkXG4gICAqIEBwYXJhbVxuICAgKlxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtib29sZWFufSBub3RpZmljYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbihcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgbm90aWZpY2F0aW9uOiBib29sZWFuID0gdHJ1ZVxuICApIHtcbiAgICBsZXQgbWV0YWRhdGE6IGFueTtcbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgICBtZXRhZGF0YSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmNoZWNrSWZMYXN0TWVzc2FnZVNob3VsZFVwZGF0ZShtZXNzYWdlKSkge1xuICAgICAgICB0aGlzLm1ha2VDb252ZXJzYXRpb24obWVzc2FnZSlcbiAgICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGV0IGlzQ3VzdG9tTWVzc2FnZTogYm9vbGVhbiA9IG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQ3VzdG9tTWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uS2V5O1xuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uTGlzdCA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgICAgICAgLy8gaWYgc2VuZGVyIGlzIG5vdCBsb2dnZWQgaW4gdXNlciB0aGVuICBpbmNyZW1lbnQgY291bnRcbiAgICAgICAgICAgICAgbGV0IHVucmVhZE1lc3NhZ2VDb3VudCA9XG4gICAgICAgICAgICAgICAgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpIHx8XG4gICAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkpXG4gICAgICAgICAgICAgICAgICA/IHRoaXMubWFrZVVucmVhZE1lc3NhZ2VDb3VudChjb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgICAgICA6IHRoaXMubWFrZVVucmVhZE1lc3NhZ2VDb3VudChjb252ZXJzYXRpb25PYmopIC0gMTtcbiAgICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShcbiAgICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9ialxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5BY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlLCBuZXdDb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKGxhc3RNZXNzYWdlT2JqKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0Q2F0ZWdvcnkoKSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudCh1bnJlYWRNZXNzYWdlQ291bnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBsYXN0TWVzc2FnZU9iai5nZXRTZW5kZXIoKS5nZXRVaWQoKSAhPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBtZW50aW9uZWRVc2VycyA9IGxhc3RNZXNzYWdlT2JqLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgZm9yIChcbiAgICAgICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpKytcbiAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGltZXNMb2dnZWRJblVzZXJJc01lbnRpb25lZCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3QudW5zaGlmdChuZXdDb252ZXJzYXRpb25PYmopO1xuICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbmV3Q29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBub3RpZmljYXRpb24gJiZcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGlmKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKXtcbiAgICAgICAgICAgICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGluY3JlbWVudENvdW50ID0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPyAxIDogMFxuICAgICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmogPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKGxhc3RNZXNzYWdlT2JqKTtcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChtZXNzYWdlLmdldENhdGVnb3J5KCkgIT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZXNzYWdlQ291bnQoaW5jcmVtZW50Q291bnQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSAhPSBtZXNzYWdlPy5nZXRTZW5kZXIoKT8uZ2V0VWlkKClcbiAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgaWYoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpe1xuICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgdXBkYXRlRGVsaXZlcmVkTWVzc2FnZShtZXNzYWdlUmVjZWlwdDogQ29tZXRDaGF0Lk1lc3NhZ2VSZWNlaXB0KSB7XG4gICAgbGV0IGNvbnZlcnNhdGlvbkxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFsuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IGNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIChcbiAgICAgICAgICBjLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICk/LmdldElkKCkgPT0gTnVtYmVyKG1lc3NhZ2VSZWNlaXB0LmdldE1lc3NhZ2VJZCgpKSAmJiAoXG4gICAgICAgICAgYy5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICAgICAgICApLmdldFNlbmRlcigpLmdldFVpZCgpID09IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICk7XG4gICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbjtcbiAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgIGNvbnZlcnNhdGlvbk9iaiA9IGNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgIGlmIChcbiAgICAgICAgIShcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5nZXREZWxpdmVyZWRBdCgpXG4gICAgICApIHtcbiAgICAgICAgKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldERlbGl2ZXJlZEF0KE51bWJlcih0aGlzLmdldFVpbngoKSkpO1xuICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBHZXRzIFRoZSBDb3VudCBvZiBVbnJlYWQgTWVzc2FnZXNcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBjb252ZXJzYXRpb25cbiAgICogQHBhcmFtICB7YW55fSBvcGVyYXRvclxuICAgKi9cbiAgbWFrZVVucmVhZE1lc3NhZ2VDb3VudChcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sXG4gICAgb3BlcmF0b3I6IGFueSA9IG51bGxcbiAgKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKGNvbnZlcnNhdGlvbikubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgbGV0IHVucmVhZE1lc3NhZ2VDb3VudDogbnVtYmVyID0gY29udmVyc2F0aW9uLmdldFVucmVhZE1lc3NhZ2VDb3VudCgpO1xuICAgIGlmIChcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09PVxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICApIHtcbiAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCArPSAxO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAodGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24uaGFzT3duUHJvcGVydHkoXCJndWlkXCIpICYmXG4gICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkuaGFzT3duUHJvcGVydHkoXCJndWlkXCIpICYmXG4gICAgICAgIChcbiAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICkuZ2V0R3VpZCgpID09PVxuICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSkgfHxcbiAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5oYXNPd25Qcm9wZXJ0eShcInVpZFwiKSAmJlxuICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpLmhhc093blByb3BlcnR5KFwidWlkXCIpICYmXG4gICAgICAgIChcbiAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgKS5nZXRVaWQoKSA9PT1cbiAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpKVxuICAgICkge1xuICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG9wZXJhdG9yICYmIG9wZXJhdG9yID09PSBcImRlY3JlbWVudFwiKSB7XG4gICAgICAgIHVucmVhZE1lc3NhZ2VDb3VudCA9IHVucmVhZE1lc3NhZ2VDb3VudCA/IHVucmVhZE1lc3NhZ2VDb3VudCAtIDEgOiAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gdW5yZWFkTWVzc2FnZUNvdW50ICsgMTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVucmVhZE1lc3NhZ2VDb3VudDtcbiAgfVxuICAvKipcbiAgICogQ2hhbmdlcyBkZXRhaWwgb2YgY29udmVyc2F0aW9uc1xuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICovXG4gIG1ha2VDb252ZXJzYXRpb24obWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBjb252ZXJzYXRpb25LZXk6IG51bWJlciA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgIGM/LmdldENvbnZlcnNhdGlvbklkKCkgPT09IG1lc3NhZ2U/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID49IDApIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIGNvbnZlcnNhdGlvbktleTogY29udmVyc2F0aW9uS2V5LFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iajogY29udmVyc2F0aW9uLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Q6IHRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDb21ldENoYXQuQ29tZXRDaGF0SGVscGVyLmdldENvbnZlcnNhdGlvbkZyb21NZXNzYWdlKG1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5Hcm91cCAmJlxuICAgICAgICAgICAgICAhKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgICAgICkuZ2V0U2NvcGUoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cFxuICAgICAgICAgICAgICApLnNldEhhc0pvaW5lZCh0cnVlKTtcbiAgICAgICAgICAgICAgKGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5zZXRTY29wZShcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlclNjb3BlLnBhcnRpY2lwYW50XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uS2V5OiAtMSxcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqOiBjb252ZXJzYXRpb24sXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Q6IHRoaXMuY29udmVyc2F0aW9uTGlzdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gcmVqZWN0KGVycm9yKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgQ29udmVyc2F0aW9uIFZpZXcgd2hlbiBtZXNzYWdlIGlzIGVkaXRlZCBvciBkZWxldGVkXG4gICAqL1xuICBjb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm1ha2VDb252ZXJzYXRpb24obWVzc2FnZSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSByZXNwb25zZS5jb252ZXJzYXRpb25LZXk7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICAgIHJlc3BvbnNlLmNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25MaXN0ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uTGlzdDtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBsYXN0TWVzc2FnZU9iajogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID1cbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCk7XG4gICAgICAgICAgICBpZiAobGFzdE1lc3NhZ2VPYmouZ2V0SWQoKSA9PT0gbWVzc2FnZS5nZXRJZCgpKSB7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICAgICAgICApLnNldE11aWQodGhpcy5nZXRVaW54KCkpO1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIGNvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFsuLi5jb252ZXJzYXRpb25MaXN0XTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBJZiBVc2VyIHNjcm9sbHMgdG8gdGhlIGJvdHRvbSBvZiB0aGUgY3VycmVudCBDb252ZXJzYXRpb24gbGlzdCB0aGFuIGZldGNoIG5leHQgaXRlbXMgb2YgdGhlIENvbnZlcnNhdGlvbiBsaXN0IGFuZCBhcHBlbmRcbiAgICogQHBhcmFtIEV2ZW50XG4gICAqL1xuICAvKipcbiAgICogUGxheXMgQXVkaW8gV2hlbiBNZXNzYWdlIGlzIFJlY2VpdmVkXG4gICAqL1xuICBwbGF5QXVkaW8oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZUZyb21PdGhlcix0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZUZyb21PdGhlclxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLypcbiAgICogVXBkYXRlcyB0aGUgY29udmVzYXRpb24gbGlzdCB3aGVuIGRlbGV0ZWQuXG4gICAqIEFkZGluZyBDb252ZXJzYXRpb24gT2JqZWN0IHRvIENvbWV0Y2hhdFNlcnZpY2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCkge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudD8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogc2hvd2luZyBkaWFsb2cgZm9yIGNvbmZpcm0gYW5kIGNhbmNlbFxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHNob3dDb25maXJtYXRpb25EaWFsb2cgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBjb252ZXJzYXRpb247XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbk9wdGlvbkNsaWNrKGV2ZW50OiBhbnksIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBvcHRpb246IENvbWV0Q2hhdE9wdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmRhdGE7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICBpZiAob3B0aW9uKSB7XG4gICAgICBvcHRpb24ub25DbGljayEoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIHNob3cgY29uZmlybSBkaWFsb2cgc2NyZWVuXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdG9uXG4gICAqL1xuICAvLyBjaGVjayBpcyB0aGVyZSBpcyBhbnkgYWN0aXZlIGNvbnZlcnNhdGlvbiBhbmQgbWFyayBpdCBhcyBhY3RpdmVcbiAgZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiBhcyBhbnkpPy5jb252ZXJzYXRpb25JZCA9PVxuICAgICAgICAoY29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBoYW5kbGUgY29uZmlybSBkaWFsb2cgcmVzcG9uc2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB2YWx1ZVxuICAgKi9cbiAgLy8gY2FsbGluZyBjb21ldGNoYXQuZGVsZXRlQ29udmVyc2F0aW9uIG1ldGhvZFxuICBkZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoO1xuICAgICAgbGV0IGNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICAgIGlmIChcbiAgICAgICAgY29udmVyc2F0aW9uVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICApIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuZGVsZXRlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbldpdGgsIGNvbnZlcnNhdGlvblR5cGUpLnRoZW4oXG4gICAgICAgIChkZWxldGVkQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLmNjQ29udmVyc2F0aW9uRGVsZXRlZC5uZXh0KFxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCFcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdCh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKTtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvLyBleHBvc2VkIG1ldGhvZHMgdG8gdXNlcnMuXG4gIHVwZGF0ZUxhc3RNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICB9XG4gIHJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uKTtcbiAgfVxuICBzdHlsZXM6IGFueSA9IHtcbiAgICB3cmFwcGVyU3R5bGU6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuaGVpZ2h0LFxuICAgICAgICB3aWR0aDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUud2lkdGgsXG4gICAgICAgIGJvcmRlcjpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5ib3JkZXIgfHxcbiAgICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG4gIHN1YnRpdGxlU3R5bGUgPSAoY29udmVyc2F0aW9uOiBhbnkpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnR5cGluZ0luZGljYXRvciAmJlxuICAgICAgKCh0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/LnVpZCkgfHxcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpID09XG4gICAgICAgIGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25XaXRoPy5ndWlkKVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudHlwaW5nSW5kaWN0b3JUZXh0Q29sb3IsXG4gICAgICAgIGNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sYXN0TWVzc2FnZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGl0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc1wiIFtuZ1N0eWxlXT1cInN0eWxlcy53cmFwcGVyU3R5bGUoKVwiPlxuICA8Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cImlzRGlhbG9nT3BlblwiPlxuICAgIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cImNvbmZpcm1EaWFsb2dUaXRsZVwiXG4gICAgICBbbWVzc2FnZVRleHRdPVwiY29uZmlybURpYWxvZ01lc3NhZ2VcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxCdXR0b25UZXh0XCJcbiAgICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJjb25maXJtQnV0dG9uVGV4dFwiXG4gICAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIlxuICAgICAgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlXCI+XG4gICAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG4gIDwvY29tZXRjaGF0LWJhY2tkcm9wPlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbc3RhdGVdPVwic3RhdGVcIiBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCJcbiAgICBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1N0YXRlVmlld109XCJsb2FkaW5nU3RhdGVWaWV3XCIgW2xpc3RTdHlsZV09XCJsaXN0U3R5bGVcIlxuICAgIFtlbXB0eVN0YXRlVmlld109XCJlbXB0eVN0YXRlVmlld1wiIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiXG4gICAgW2Vycm9yU3RhdGVWaWV3XT1cImVycm9yU3RhdGVWaWV3XCIgW29uU2Nyb2xsZWRUb0JvdHRvbV09XCJnZXRDb252ZXJzYXRpb25cIlxuICAgIFtsaXN0XT1cImNvbnZlcnNhdGlvbkxpc3RcIlxuICAgIFtsaXN0SXRlbVZpZXddPVwibGlzdEl0ZW1WaWV3ID8gbGlzdEl0ZW1WaWV3IDogbGlzdEl0ZW1cIiBbdGl0bGVdPVwidGl0bGVcIlxuICAgIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIj48L2NvbWV0Y2hhdC1saXN0PlxuPC9kaXY+XG48bmctdGVtcGxhdGUgI2xpc3RJdGVtIGxldC1jb252ZXJzYXRpb24+XG4gIDxjb21ldGNoYXQtbGlzdC1pdGVtIFtoaWRlU2VwYXJhdG9yXT1cImhpZGVTZXBhcmF0b3JcIlxuICAgIFthdmF0YXJTdHlsZV09XCJhdmF0YXJTdHlsZVwiXG4gICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cImdldFN0YXR1c0luZGljYXRvclN0eWxlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtpZF09XCJjb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbklkXCJcbiAgICBbaXNBY3RpdmVdPVwiZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbilcIlxuICAgIChjYy1saXN0aXRlbS1jbGlja2VkKT1cIm9uQ2xpY2soY29udmVyc2F0aW9uKVwiXG4gICAgW3RpdGxlXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8ubmFtZVwiXG4gICAgW3N0YXR1c0luZGljYXRvckljb25dPVwiY2hlY2tHcm91cFR5cGUoY29udmVyc2F0aW9uKVwiXG4gICAgW3N0YXR1c0luZGljYXRvckNvbG9yXT1cImNoZWNrU3RhdHVzVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbbGlzdEl0ZW1TdHlsZV09XCJsaXN0SXRlbVN0eWxlXCJcbiAgICBbYXZhdGFyVVJMXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8uYXZhdGFyIHx8IGNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8uaWNvblwiXG4gICAgW2F2YXRhck5hbWVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCI+XG4gICAgPGRpdiBzbG90PVwic3VidGl0bGVWaWV3XCIgKm5nSWY9XCJzdWJ0aXRsZVZpZXc7ZWxzZSBjb252ZXJzYXRpb25TdWJ0aXRsZVwiPlxuICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInN1YnRpdGxlVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiBjb252ZXJzYXRpb24gfVwiPlxuICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgPC9kaXY+XG4gICAgPG5nLXRlbXBsYXRlICNjb252ZXJzYXRpb25TdWJ0aXRsZT5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3N1YnRpdGxlLXZpZXcgXCIgc2xvdD1cInN1YnRpdGxlVmlld1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGhyZWFkdmlld1wiXG4gICAgICAgICAgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlPy5wYXJlbnRNZXNzYWdlSWRcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWxhYmVsIFtsYWJlbFN0eWxlXT1cIml0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSgpXCJcbiAgICAgICAgICAgIFt0ZXh0XT1cInRocmVhZEluZGljYXRvclRleHRcIj4gPC9jb21ldGNoYXQtbGFiZWw+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1pY29uIFtVUkxdPVwidGhyZWFkSWNvblVSTFwiXG4gICAgICAgICAgICBbaWNvblN0eWxlXT1cImljb25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24+XG5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zdWJ0aXRsZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19yZWFkcmVjZWlwdFwiXG4gICAgICAgICAgICAqbmdJZj1cImlzUmVjZWlwdERpc2FibGUoY29udmVyc2F0aW9uKVwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1yZWNlaXB0IFtyZWNlaXB0XT1cImdldE1lc3NhZ2VSZWNlaXB0KGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgICAgICBbcmVjZWlwdFN0eWxlXT1cInJlY2VpcHRTdHlsZVwiIFtzZW50SWNvbl09XCJzZW50SWNvblwiXG4gICAgICAgICAgICAgIFtlcnJvckljb25dPVwiZXJyb3JJY29uXCIgW2RlbGl2ZXJlZEljb25dPVwiZGVsaXZlcmVkSWNvblwiXG4gICAgICAgICAgICAgIFtyZWFkSWNvbl09XCJyZWFkSWNvblwiPjwvY29tZXRjaGF0LXJlY2VpcHQ+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8ZGl2IFtuZ1N0eWxlXT1cInN1YnRpdGxlU3R5bGUoY29udmVyc2F0aW9uKVwiIGNsYXNzPVwiY2Mtc3VidGl0bGVfX3RleHRcIlxuICAgICAgICAgICAgW2lubmVySFRNTF09XCJzZXRTdWJ0aXRsZShjb252ZXJzYXRpb24pXCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICA8L2Rpdj5cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDxkaXYgc2xvdD1cIm1lbnVWaWV3XCIgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19vcHRpb25zdmlld1wiXG4gICAgICAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgPGRpdiAqbmdJZj1cIm9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwib3B0aW9ucyhjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICAoY2MtbWVudS1jbGlja2VkKT1cIm9uT3B0aW9uQ2xpY2soJGV2ZW50LGNvbnZlcnNhdGlvbilcIlxuICAgICAgICAgIFttZW51TGlzdFN0eWxlXT1cIm1lbnVzdHlsZVwiPlxuXG4gICAgICAgIDwvY29tZXRjaGF0LW1lbnUtbGlzdD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiAqbmdJZj1cIiFvcHRpb25zICYmIGNvbnZlcnNhdGlvbk9wdGlvbnNcIj5cbiAgICAgICAgPGNvbWV0Y2hhdC1tZW51LWxpc3QgW2RhdGFdPVwiY29udmVyc2F0aW9uT3B0aW9uc1wiXG4gICAgICAgICAgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudCxjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICBbbWVudUxpc3RTdHlsZV09XCJtZW51c3R5bGVcIj5cblxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IHNsb3Q9XCJ0YWlsVmlld1wiIGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fdGFpbC12aWV3XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFpbF9fdmlld1wiXG4gICAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5ub25lICYmIGNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2VcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWRhdGVcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LWRhdGUgKm5nSWY9XCJjb252ZXJzYXRpb24/Lmxhc3RNZXNzYWdlXCJcbiAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiZGF0ZVN0eWxlXCJcbiAgICAgICAgICAgIFt0aW1lc3RhbXBdPVwiY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZT8uc2VudEF0XCJcbiAgICAgICAgICAgIFtwYXR0ZXJuXT1cImdldERhdGUoKVwiPjwvY29tZXRjaGF0LWRhdGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fYmFkZ2VcIj5cbiAgICAgICAgICA8IS0tIDxjb21ldGNoYXQtaWNvbiAqbmdJZj1cImNvbnZlcnNhdGlvbj8uZ2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KClcIiBbbmdTdHlsZV09XCJnZXRVbnJlYWRNZW50aW9uc0ljb25TdHlsZSgpXCIgW2ljb25TdHlsZV09Z2V0TWVudGlvbkljb25TdHlsZSgpIFtVUkxdPVwibWVudGlvbnNJY29uVVJMXCI+PC9jb21ldGNoYXQtaWNvbj4gLS0+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1iYWRnZSBbY291bnRdPVwiY29udmVyc2F0aW9uPy51bnJlYWRNZXNzYWdlQ291bnRcIlxuICAgICAgICAgICAgW2JhZGdlU3R5bGVdPVwiYmFkZ2VTdHlsZVwiPjwvY29tZXRjaGF0LWJhZGdlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3NlbGVjdGlvbi12aWV3XCJcbiAgICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlICE9IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgICAgPG5nLWNvbnRhaW5lciAqbmdUZW1wbGF0ZU91dGxldD1cInRhaWxWaWV3XCI+XG4gICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvY29tZXRjaGF0LWxpc3QtaXRlbT5cbiAgPG5nLXRlbXBsYXRlICN0YWlsVmlldz5cbiAgICA8ZGl2ICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5zaW5nbGVcIj5cbiAgICAgIDxjb21ldGNoYXQtcmFkaW8tYnV0dG9uXG4gICAgICAgIChjYy1yYWRpby1idXR0b24tY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtcmFkaW8tYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm11bHRpcGxlXCI+XG4gICAgICA8Y29tZXRjaGF0LWNoZWNrYm94IFtjaGVja2JveFN0eWxlXT1cImNoZWNrYm94U3R5bGVcIlxuICAgICAgICAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG48L25nLXRlbXBsYXRlPlxuIl19