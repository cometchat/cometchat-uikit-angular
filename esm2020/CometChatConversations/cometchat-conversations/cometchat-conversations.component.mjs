import "@cometchat/uikit-elements";
import { AvatarStyle, BadgeStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle, } from "@cometchat/uikit-elements";
import { CometChatSoundManager, CometChatUIKitUtility, ConversationUtils, ConversationsStyle, ListStyle, MessageReceiptUtils, } from "@cometchat/uikit-shared";
import { CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatUIKitConstants, CometChatUserEvents, DatePatterns, MessageStatus, SelectionMode, States, TitleAlignment, fontHelper, localize, MentionsTargetElement, } from "@cometchat/uikit-resources";
import { ChangeDetectionStrategy, Component, Input, } from "@angular/core";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
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
        this.protectedGroupIcon = "assets/Locked.svg";
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
                    case CometChatUIKitConstants.userStatusType.online: {
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
            return this.statusColor[user.getStatus()];
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
            switch (conversation.getConversationType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    image = this.protectedGroupIcon;
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
        this.getConversation();
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
        let index = this.conversationList.findIndex((element) => element.getConversationId() == conversation.getConversationId());
        this.conversationList.splice(index, 1, conversation);
        this.ref.detectChanges();
    }
    subscribeToEvents() {
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
        this.ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((item) => {
            let conversation = this.getConversationFromUser(item);
            if (conversation) {
                this.removeConversation(conversation);
            }
        });
        this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object) => {
            let message = object.message;
            if (object.status == MessageStatus.success) {
                this.updateEditedMessage(message);
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
            CometChat.CometChatHelper.getConversationFromMessage(messageObject).then((conversation) => {
                if (conversation &&
                    this.activeConversation &&
                    conversation?.getConversationId() ==
                        this.activeConversation?.getConversationId()) {
                    this.updateEditedMessage(messageObject);
                    this.resetUnreadCount();
                }
            });
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
            if (!this.disableUsersPresence) {
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
                if (!this.disableReceipt) {
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
                    if (!this.disableReceipt) {
                        this.updateDeliveredMessage(messageReceipt);
                    }
                });
            this.onTypingStarted = CometChatMessageEvents.onTypingStarted.subscribe((typingIndicator) => {
                if (!this.disableTyping) {
                    this.typingIndicator = typingIndicator;
                    this.ref.detectChanges();
                }
            });
            this.onTypingEnded = CometChatMessageEvents.onTypingEnded.subscribe((typingIndicator) => {
                this.typingIndicator = null;
                this.ref.detectChanges();
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
            this.makeConversation(message)
                .then((response) => {
                const conversationKey = response.conversationKey;
                const conversationObj = response.conversationObj;
                const conversationList = response.conversationList;
                if (conversationKey > -1) {
                    // if sender is not logged in user then  increment count
                    let unreadMessageCount = (this.loggedInUser?.getUid() != message.getSender().getUid() ||
                        this.loggedInUser?.getUid() == message.getReceiverId()) &&
                        (!metadata ||
                            !metadata.hasOwnProperty("incrementUnreadCount") ||
                            metadata.incrementUnreadCount == true)
                        ? this.makeUnreadMessageCount(conversationObj)
                        : this.makeUnreadMessageCount(conversationObj) - 1;
                    let lastMessageObj = this.makeLastMessage(message, conversationObj);
                    let newConversationObj = conversationObj;
                    if (message instanceof CometChat.Action) {
                        this.updateConversationWithForGroup(message, newConversationObj);
                    }
                    newConversationObj.setLastMessage(lastMessageObj);
                    newConversationObj.setUnreadMessageCount(unreadMessageCount);
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
                        //Commented for now. To be used in UMC
                        // newConversationObj.setUnreadMentionInMessageCount(
                        //   lastMessageObj.getMentionedUsers()
                        //     ? newConversationObj.getUnreadMentionInMessageCount() +
                        //     timesLoggedInUserIsMentioned
                        //     : 0
                        // );
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
                    conversationObj.setUnreadMessageCount(incrementCount);
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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\" *ngIf=\"selectionMode == selectionmodeEnum.none\">\n        <div class=\"cc-date\">\n          <cometchat-date [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatConversationsComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-conversations", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\" *ngIf=\"selectionMode == selectionmodeEnum.none\">\n        <div class=\"cc-date\">\n          <cometchat-date [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1osYUFBYSxFQUNiLGFBQWEsRUFDYixNQUFNLEVBQ04sY0FBYyxFQUNkLFVBQVUsRUFDVixRQUFRLEVBR1IscUJBQXFCLEdBQ3RCLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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bWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuXG5pbXBvcnQge1xuICBBdmF0YXJTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbiAgQmFkZ2VTdHlsZSxcbiAgQ29uZmlybURpYWxvZ1N0eWxlLFxuICBEYXRlU3R5bGUsXG4gIEljb25TdHlsZSxcbiAgTGlzdEl0ZW1TdHlsZSxcbiAgUmVjZWlwdFN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgRG9tU2FuaXRpemVyLCBTYWZlSHRtbCB9IGZyb20gXCJAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyXCI7XG5pbXBvcnQge1xuICBCYXNlU3R5bGUsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBDb252ZXJzYXRpb25VdGlscyxcbiAgQ29udmVyc2F0aW9uc1N0eWxlLFxuICBMaXN0U3R5bGUsXG4gIE1lc3NhZ2VSZWNlaXB0VXRpbHMsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQ2FyZE1lc3NhZ2UsXG4gIENvbWV0Q2hhdENhbGxFdmVudHMsXG4gIENvbWV0Q2hhdENvbnZlcnNhdGlvbkV2ZW50cyxcbiAgQ29tZXRDaGF0R3JvdXBFdmVudHMsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdE9wdGlvbixcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFVzZXJFdmVudHMsXG4gIEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSxcbiAgRGF0ZVBhdHRlcm5zLFxuICBGb3JtTWVzc2FnZSxcbiAgSUdyb3VwTGVmdCxcbiAgSUdyb3VwTWVtYmVyQWRkZWQsXG4gIElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCxcbiAgSUdyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLFxuICBJTWVzc2FnZXMsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFNlbGVjdGlvbk1vZGUsXG4gIFN0YXRlcyxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxuICBTY2hlZHVsZXJNZXNzYWdlLFxuICBVc2VyUHJlc2VuY2VQbGFjZW1lbnQsXG4gIE1lbnRpb25zVGFyZ2V0RWxlbWVudCxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgSG9zdEJpbmRpbmcsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuXG5pbXBvcnQgeyBDaGF0Q29uZmlndXJhdG9yIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvQ2hhdENvbmZpZ3VyYXRvclwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21ldENoYXRVSUtpdCB9IGZyb20gXCIuLi8uLi9TaGFyZWQvQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcblxuLyoqXG4gKlxuICogQ29tZXRDaGF0Q29udmVyc2F0aW9uIGlzIGEgd3JhcHBlciBjb21wb25lbnQgY29uc2lzdHMgb2YgQ29tZXRDaGF0TGlzdEJhc2VDb21wb25lbnQgYW5kIENvbnZlcnNhdGlvbkxpc3RDb21wb25lbnQuXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnNcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRDb252ZXJzYXRpb25zQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICAvKipcbiAgICogVGhpcyBwcm9wZXJ0aWVzIHdpbGwgY29tZSBmcm9tIFBhcmVudC5cbiAgICovXG4gIEBJbnB1dCgpIHN1YnRpdGxlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHRpdGxlOiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNIQVRTXCIpOyAvL1RpdGxlIG9mIHRoZSBjb21wb25lbnRcbiAgQElucHV0KCkgb3B0aW9ucyE6XG4gICAgfCAoKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4gQ29tZXRDaGF0T3B0aW9uW10pXG4gICAgfCBudWxsO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZUhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7IC8vIHBsYWNlaG9sZGVyIHRleHQgb2Ygc2VhcmNoIGlucHV0XG4gIEBJbnB1dCgpIGRpc2FibGVVc2Vyc1ByZXNlbmNlOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVSZWNlaXB0OiBib29sZWFuID0gdHJ1ZTtcbiAgQElucHV0KCkgZGlzYWJsZVR5cGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBkZWxpdmVyZWRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLWRlbGl2ZXJlZC5zdmdcIjtcbiAgQElucHV0KCkgcmVhZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtcmVhZC5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JJY29uOiBzdHJpbmcgPSBcImFzc2V0cy93YXJuaW5nLXNtYWxsLnN2Z1wiO1xuICBASW5wdXQoKSBkYXRlUGF0dGVybjogRGF0ZVBhdHRlcm5zID0gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICBASW5wdXQoKSBvbkVycm9yOiAoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQgPSAoXG4gICAgZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb25cbiAgKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9O1xuICBASW5wdXQoKSBzZW50SWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1zZW50LnN2Z1wiO1xuICBASW5wdXQoKSBwcml2YXRlR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Qcml2YXRlLnN2Z1wiO1xuICBASW5wdXQoKSBwcm90ZWN0ZWRHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL0xvY2tlZC5zdmdcIjtcbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlczogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgYWN0aXZlQ29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7IC8vc2VsZWN0ZWQgY29udmVyc2F0aW9uXG4gIEBJbnB1dCgpIHNlYXJjaEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3NlYXJjaC5zdmdcIjsgLy9pbWFnZSBVUkwgb2YgdGhlIHNlYXJjaCBpY29uXG4gIEBJbnB1dCgpIGhpZGVTZWFyY2g6IGJvb2xlYW4gPSB0cnVlOyAvL3N3aXRjaCBvbi9mZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlcjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblNlbGVjdCE6IChcbiAgICBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sXG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW5cbiAgKSA9PiB2b2lkO1xuICBASW5wdXQoKSBsb2FkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3Bpbm5lci5zdmdcIjtcbiAgQElucHV0KCkgZXJyb3JTdGF0ZVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBsb2FkaW5nU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fQ0hBVFNfRk9VTkRcIik7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgQElucHV0KCkgdGl0bGVBbGlnbm1lbnQ6IFRpdGxlQWxpZ25tZW50ID0gVGl0bGVBbGlnbm1lbnQubGVmdDtcblxuICBASW5wdXQoKSBsaXN0SXRlbVZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBtZW51ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgaGlkZVNlcGFyYXRvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWFyY2hQbGFjZWhvbGRlcjogc3RyaW5nID0gbG9jYWxpemUoXCJTRUFSQ0hcIik7XG4gIEBJbnB1dCgpIGhpZGVFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3Rpb25Nb2RlOiBTZWxlY3Rpb25Nb2RlID0gU2VsZWN0aW9uTW9kZS5ub25lO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjb25maXJtRGlhbG9nVGl0bGUgPSBsb2NhbGl6ZShcIkRFTEVURV9DT05WRVJTQVRJT05cIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1CdXR0b25UZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkRFTEVURVwiKTtcbiAgQElucHV0KCkgY2FuY2VsQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJDQU5DRUxcIik7XG4gIEBJbnB1dCgpIGNvbmZpcm1EaWFsb2dNZXNzYWdlOiBzdHJpbmcgPSBsb2NhbGl6ZShcbiAgICBcIldPVUxEX19ZT1VfTElLRV9UT19ERUxFVEVfVEhJU19DT05WRVJTQVRJT05cIlxuICApO1xuICBASW5wdXQoKSBvbkl0ZW1DbGljayE6IChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHZvaWQ7XG4gIEBJbnB1dCgpIGRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IFwiXCIsXG4gICAgY2FuY2VsQnV0dG9uQmFja2dyb3VuZDogXCJcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOiBcIlwiLFxuICAgIGNvbmZpcm1CdXR0b25UZXh0Rm9udDogXCJcIixcbiAgICBjYW5jZWxCdXR0b25UZXh0Q29sb3I6IFwiXCIsXG4gICAgY2FuY2VsQnV0dG9uVGV4dEZvbnQ6IFwiXCIsXG4gICAgdGl0bGVGb250OiBcIlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiXCIsXG4gICAgbWVzc2FnZVRleHRGb250OiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Q29sb3I6IFwiXCIsXG4gICAgYmFja2dyb3VuZDogXCJcIixcbiAgICBib3JkZXI6IFwiMXB4IHNvbGlkICNmMmYyZjJcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhZGdlU3R5bGU6IEJhZGdlU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjVweFwiLFxuICAgIGhlaWdodDogXCIxNXB4XCIsXG4gICAgYmFja2dyb3VuZDogXCIjNWFhZWZmXCIsXG4gICAgdGV4dENvbG9yOiBcIndoaXRlXCIsXG4gICAgdGV4dEZvbnQ6IFwiNDAwIDEzcHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICB9O1xuICBASW5wdXQoKSBkYXRlU3R5bGU6IERhdGVTdHlsZSA9IHtcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRleHRDb2xvcjogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gIH07XG4gIEBJbnB1dCgpIGNvbnZlcnNhdGlvbnNTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIlwiLFxuICAgIGhlaWdodDogXCJcIixcbiAgICBib3JkZXI6IFwiXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIlwiLFxuICB9O1xuICBASW5wdXQoKSBsaXN0SXRlbVN0eWxlOiBMaXN0SXRlbVN0eWxlID0ge1xuICAgIGhlaWdodDogXCI5NyVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIEBJbnB1dCgpIHN0YXR1c0luZGljYXRvclN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjEwcHhcIixcbiAgICB3aWR0aDogXCIxMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgdHlwaW5nSW5kaWNhdG9yVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJJU19UWVBJTkdcIik7XG4gIEBJbnB1dCgpIHRocmVhZEluZGljYXRvclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSU5fQV9USFJFQURcIik7XG4gIEBJbnB1dCgpIGF2YXRhclN0eWxlOiBBdmF0YXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSByZWNlaXB0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IHt9O1xuICBjY0dyb3VwTWVtYmVyQWRkZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJKb2luZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJLaWNrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJCYW5uZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjT3duZXJzaGlwQ2hhbmdlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlU2VudCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBjY01lc3NhZ2VEZWxldGUhOiBTdWJzY3JpcHRpb247XG4gIGNjR3JvdXBEZWxldGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTGVmdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NVc2VyQmxvY2tlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UZXh0TWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lZGlhTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25Gb3JtTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DYXJkTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzUmVhZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlRWRpdGVkITogU3Vic2NyaXB0aW9uO1xuICBvbk1lc3NhZ2VzRGVsaXZlcmVkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ1N0YXJ0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVHlwaW5nRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY091dGdvaW5nQ2FsbCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbFJlamVjdGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsRW5kZWQhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxBY2NlcHRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgaWNvblN0eWxlOiBhbnkgPSB7XG4gICAgaWNvblRpbnQ6IFwibGlnaHRncmV5XCIsXG4gICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICB3aWR0aDogXCIyMHB4XCIsXG4gIH07XG4gIGxpc3RTdHlsZTogTGlzdFN0eWxlID0gbmV3IExpc3RTdHlsZSh7fSk7XG4gIG1lbnVzdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIHRleHRGb250OiBcIlwiLFxuICAgIHRleHRDb2xvcjogXCJibGFja1wiLFxuICAgIGljb25UaW50OiBcImdyZXlcIixcbiAgICBpY29uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGljb25Cb3JkZXI6IFwibm9uZVwiLFxuICAgIGljb25Cb3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIHN1Ym1lbnVXaWR0aDogXCI3MHB4XCIsXG4gICAgc3VibWVudUhlaWdodDogXCIyMHB4XCIsXG4gICAgc3VibWVudUJvcmRlcjogXCIxcHggc29saWQgI2U4ZThlOFwiLFxuICAgIHN1Ym1lbnVCb3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgc3VibWVudUJhY2tncm91bmQ6IFwid2hpdGVcIixcbiAgfTtcbiAgcHVibGljIHR5cGluZ0luZGljYXRvciE6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IgfCBudWxsO1xuICBwdWJsaWMgdHlwaW5nTGlzdGVuZXJJZDogc3RyaW5nID1cbiAgICBcImNvbnZlcnNhdGlvbl9fTElTVEVORVJcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgY2FsbExpc3RlbmVySWQgPSBcImNhbGxfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNvbm5lY3Rpb25MaXN0ZW5lcklkID0gXCJjb25uZWN0aW9uX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHNlbGVjdGlvbm1vZGVFbnVtOiB0eXBlb2YgU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGU7XG4gIHB1YmxpYyBpc0RpYWxvZ09wZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGlzRW1wdHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGlzTG9hZGluZzogYm9vbGVhbiA9IHRydWU7XG4gIHB1YmxpYyBzdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBzdGF0dXNDb2xvcjogYW55ID0ge1xuICAgIG9ubGluZTogXCJcIixcbiAgICBwcml2YXRlOiBcIlwiLFxuICAgIHBhc3N3b3JkOiBcIiNGN0E1MDBcIixcbiAgICBwdWJsaWM6IFwiXCIsXG4gIH07XG4gIHB1YmxpYyBsaW1pdDogbnVtYmVyID0gMzA7XG4gIHB1YmxpYyBpc0Vycm9yOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbXTtcbiAgcHVibGljIHNjcm9sbGVkVG9Cb3R0b206IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNoZWNrSXRlbUNoYW5nZTogYm9vbGVhbiA9IGZhbHNlO1xuICBjb252ZXJzYXRpb25PcHRpb25zITogQ29tZXRDaGF0T3B0aW9uW107XG4gIHB1YmxpYyBzaG93Q29uZmlybURpYWxvZzogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uVG9CZURlbGV0ZWQ6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gbnVsbDtcbiAgcHVibGljIHVzZXJMaXN0ZW5lcklkOiBzdHJpbmcgPSBcImNoYXRsaXN0X3VzZXJfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF9ncm91cF9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBwdWJsaWMgZ3JvdXBUb1VwZGF0ZTogQ29tZXRDaGF0Lkdyb3VwIHwge30gPSB7fTtcbiAgc2FmZUh0bWwhOiBTYWZlSHRtbDtcbiAgZW5hYmxlUG9sbHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlU3RpY2tlcnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlV2hpdGVib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBlbmFibGVEb2N1bWVudDogYm9vbGVhbiA9IGZhbHNlO1xuICB0aHJlYWRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy90aHJlYWQtYXJyb3cuc3ZnXCI7XG4gIHB1YmxpYyBjb25maXJtRGlhbG9nU3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gIH07XG4gIHN1YnRpdGxlVmFsdWUhOiBzdHJpbmc7XG4gIG1vZGFsU3R5bGU6IEJhc2VTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMjMwcHhcIixcbiAgICB3aWR0aDogXCIyNzBweFwiLFxuICB9O1xuICBmaXJzdFJlbG9hZDogYm9vbGVhbiA9IGZhbHNlO1xuICBpc0FjdGl2ZTogYm9vbGVhbiA9IHRydWU7XG4gIGNvbnRhY3RzTm90Rm91bmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY2hhdFNlYXJjaCE6IGJvb2xlYW47XG4gIHJlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbnNSZXF1ZXN0O1xuICAvKipcbiAgICogUHJvcGVydGllcyBmb3IgaW50ZXJuYWwgdXNlXG4gICAqL1xuICBwdWJsaWMgbG9jYWxpemUgPSBsb2NhbGl6ZTtcbiAgLyoqXG4gICAqIFRoaXMgcHJvcGVydGllcyB3aWxsIGNvbWUgZnJvbSBQYXJlbnQuXG4gICAqL1xuICBASW5wdXQoKSBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gQElucHV0KCkgbWVudGlvbnNJY29uVVJMITogc3RyaW5nO1xuICBASW5wdXQoKSBkaXNhYmxlTWVudGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dEZvcm1hdHRlcnM/OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPjtcblxuICAvKipcbiAgICogUHJvcGVydGllcyBmb3IgaW50ZXJuYWwgdXNlXG4gICAqL1xuICAvKipcbiAgICogcGFzc2luZyB0aGlzIGNhbGxiYWNrIHRvIG1lbnVMaXN0IGNvbXBvbmVudCBvbiBkZWxldGUgY2xpY2tcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbn0gY29udmVyc2F0aW9uXG4gICAqL1xuICBkZWxldGVDb252ZXJzYXRpb25PbkNsaWNrOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NvbmZpcm1hdGlvbkRpYWxvZyh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkISk7XG4gIH07XG4gIC8vIGNhbGxiYWNrIGZvciBjb25maXJtRGlhbG9nQ29tcG9uZW50XG4gIG9uQ29uZmlybUNsaWNrID0gKCkgPT4ge1xuICAgIHRoaXMuZGVsZXRlU2VsZWN0ZWRDb252ZXJzYXRpb24oKTtcbiAgfTtcbiAgb25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24sIGV2ZW50OiBhbnkpIHtcbiAgICBsZXQgc2VsZWN0ZWQ6IGJvb2xlYW4gPSBldmVudC5kZXRhaWwuY2hlY2tlZDtcbiAgICBpZiAodGhpcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5vblNlbGVjdChjb252ZXJzYXRpb24sIHNlbGVjdGVkKTtcbiAgICB9XG4gIH1cbiAgc2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgaWYgKFxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cFxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgICAgd2lkdGg6IFwiMTJweFwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMTZweFwiLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGU7XG4gICAgfVxuICB9O1xuXG4gIC8vVG8gYmUgZW5hYmxlZCBpbiBVTUNcbiAgLy8gZ2V0TWVudGlvbkljb25TdHlsZSgpOiBJY29uU3R5bGUge1xuICAvLyAgIHJldHVybiBuZXcgSWNvblN0eWxlKHtcbiAgLy8gICAgIGhlaWdodDogXCIxNnB4XCIsXG4gIC8vICAgICB3aWR0aDogXCIxNnB4XCIsXG4gIC8vICAgICBpY29uVGludDpcbiAgLy8gICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5tZW50aW9uSWNvblRpbnQgPz9cbiAgLy8gICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAvLyAgIH0pO1xuICAvLyB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCB1c2VyOiBDb21ldENoYXQuVXNlciA9XG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2VcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW3VzZXIuZ2V0U3RhdHVzKCldO1xuICAgIH1cbiAgfVxuXG4gIGdldEV4dGVuc2lvbkRhdGEobWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgbGV0IG1lc3NhZ2VUZXh0O1xuICAgIC8veHNzIGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IHhzc0RhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJ4c3MtZmlsdGVyXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIHhzc0RhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHhzc0RhdGEsIFwic2FuaXRpemVkX3RleHRcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHhzc0RhdGEsIFwiaGFzWFNTXCIpICYmXG4gICAgICB4c3NEYXRhLmhhc1hTUyA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSB4c3NEYXRhLnNhbml0aXplZF90ZXh0O1xuICAgIH1cbiAgICAvL2RhdGFtYXNraW5nIGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IG1hc2tlZERhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJkYXRhLW1hc2tpbmdcIlxuICAgICk7XG4gICAgaWYgKFxuICAgICAgbWFza2VkRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkobWFza2VkRGF0YSwgXCJkYXRhXCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgbWFza2VkRGF0YS5kYXRhLFxuICAgICAgICBcInNlbnNpdGl2ZV9kYXRhXCJcbiAgICAgICkgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KFxuICAgICAgICBtYXNrZWREYXRhLmRhdGEsXG4gICAgICAgIFwibWVzc2FnZV9tYXNrZWRcIlxuICAgICAgKSAmJlxuICAgICAgbWFza2VkRGF0YS5kYXRhLnNlbnNpdGl2ZV9kYXRhID09PSBcInllc1wiXG4gICAgKSB7XG4gICAgICBtZXNzYWdlVGV4dCA9IG1hc2tlZERhdGEuZGF0YS5tZXNzYWdlX21hc2tlZDtcbiAgICB9XG4gICAgLy9wcm9mYW5pdHkgZXh0ZW5zaW9ucyBkYXRhXG4gICAgY29uc3QgcHJvZmFuZURhdGEgPSBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tNZXNzYWdlRm9yRXh0ZW5zaW9uc0RhdGEoXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgXCJwcm9mYW5pdHktZmlsdGVyXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIHByb2ZhbmVEYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShwcm9mYW5lRGF0YSwgXCJwcm9mYW5pdHlcIikgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KHByb2ZhbmVEYXRhLCBcIm1lc3NhZ2VfY2xlYW5cIikgJiZcbiAgICAgIHByb2ZhbmVEYXRhLnByb2Zhbml0eSA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSBwcm9mYW5lRGF0YS5tZXNzYWdlX2NsZWFuO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZVRleHQgfHwgKG1lc3NhZ2VPYmplY3QgYXMgYW55KS50ZXh0O1xuICB9XG4gIHNldFN1YnRpdGxlID0gKGNvbnZlcnNhdGlvbk9iamVjdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGlmICh0aGlzLnR5cGluZ0luZGljYXRvcikge1xuICAgICAgY29uc3QgaXNUeXBpbmcgPVxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/Lmd1aWQgPT1cbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpO1xuICAgICAgaWYgKGlzVHlwaW5nKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnR5cGluZ0luZGljYXRvci5nZXRTZW5kZXIoKS5nZXROYW1lKCl9ICR7dGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0XG4gICAgICAgICAgfWA7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAoY29udmVyc2F0aW9uT2JqZWN0IGFzIGFueSk/LmNvbnZlcnNhdGlvbldpdGg/LnVpZCA9PVxuICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvcj8uZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJUeXBlKCkgIT09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBpbmdJbmRpY2F0b3JUZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgc3VidGl0bGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRMYXN0Q29udmVyc2F0aW9uTWVzc2FnZShcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdCxcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyISxcblxuICAgICAge1xuICAgICAgICBkaXNhYmxlTWVudGlvbnM6IHRoaXMuZGlzYWJsZU1lbnRpb25zLFxuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgIG1lbnRpb25zVGFyZ2V0RWxlbWVudDogTWVudGlvbnNUYXJnZXRFbGVtZW50LmNvbnZlcnNhdGlvbixcbiAgICAgICAgdGV4dEZvcm1hdHRlcnM6IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICAgIH1cbiAgICApO1xuICAgIGxldCBpY29uID1cbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0VHlwZSgpID09XG4gICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICA/IFwi8J+TniBcIlxuICAgICAgICA6IFwi8J+TuSBcIjtcblxuICAgIHJldHVybiB0aGlzLnNhbml0aXplci5ieXBhc3NTZWN1cml0eVRydXN0SHRtbChcbiAgICAgIGNvbnZlcnNhdGlvbk9iamVjdD8uZ2V0TGFzdE1lc3NhZ2UoKT8uZ2V0Q2F0ZWdvcnkoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbFxuICAgICAgICA/IGljb24gKyBzdWJ0aXRsZVxuICAgICAgICA6IHN1YnRpdGxlXG4gICAgKTtcbiAgfTtcblxuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIGdldFVucmVhZE1lbnRpb25zSWNvblN0eWxlKCkge1xuICAvLyAgIHJldHVybiB7XG4gIC8vICAgICBwYWRkaW5nUmlnaHQ6IFwiM3B4XCIsXG4gIC8vICAgfTtcbiAgLy8gfVxuXG4gIGNoZWNrR3JvdXBUeXBlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbik6IHN0cmluZyB7XG4gICAgbGV0IGltYWdlOiBzdHJpbmcgPSBcIlwiO1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApIHtcbiAgICAgIHN3aXRjaCAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLkdyb3VwVHlwZXMucGFzc3dvcmQ6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2U7XG4gIH1cbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25DYW5jZWxDbGljayA9ICgpID0+IHtcbiAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZ2V0TWVzc2FnZVJlY2VpcHQgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgbGV0IHJlY2VpcHQgPSBNZXNzYWdlUmVjZWlwdFV0aWxzLmdldFJlY2VpcHRTdGF0dXMoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKVxuICAgICk7XG4gICAgcmV0dXJuIHJlY2VpcHQ7XG4gIH07XG4gIGdldERhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0ZVBhdHRlcm4gPz8gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICB9XG4gIG9wdGlvbnNTdHlsZSA9IHtcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlLFxuICAgIHByaXZhdGUgc2FuaXRpemVyOiBEb21TYW5pdGl6ZXJcbiAgKSB7IH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlciA9XG4gICAgICAgIG5ldyBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdCk7XG4gICAgfVxuICAgIHRoaXMuc2V0Q29udmVyc2F0aW9uT3B0aW9ucygpO1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycyh0aGlzLmNvbnZlcnNhdGlvblVwZGF0ZWQpO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uKCk7XG4gIH1cbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3Q29udmVyc2F0aW9ucygpO1xuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvbklkKCkgPT0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEsIGNvbnZlcnNhdGlvbik7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmdyb3VwISk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBpdGVtLnVzZXJBZGRlZEluITtcbiAgICAgICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb25bXSA9IGl0ZW0ubWVzc2FnZXMhO1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS51c2VyQWRkZWRJbiEpO1xuICAgICAgICBjb252ZXJzYXRpb24/LnNldENvbnZlcnNhdGlvbldpdGgoZ3JvdXApO1xuICAgICAgICBjb252ZXJzYXRpb24/LnNldExhc3RNZXNzYWdlKGFjdGlvbk1lc3NhZ2VbYWN0aW9uTWVzc2FnZT8ubGVuZ3RoIC0gMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24hKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtKTtcbiAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAgICAgKGM/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICAgICAgaXRlbS5sZWZ0R3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tVXNlcihpdGVtKTtcbiAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqZWN0Lm1lc3NhZ2UhO1xuICAgICAgICBpZiAob2JqZWN0LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQuc3Vic2NyaWJlKFxuICAgICAgKG9iajogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmoubWVzc2FnZSE7XG4gICAgICAgIGlmIChvYmouc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShcbiAgICAgICAgICBtZXNzYWdlT2JqZWN0XG4gICAgICAgICkudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2VPYmplY3QgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXRVbnJlYWRDb3VudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZT8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT1cbiAgICAgICAgdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoXG4gICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICApOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICBncm91cC5nZXRHdWlkKClcbiAgICApO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25MaXN0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjaGFuZ2VbXCJhY3RpdmVDb252ZXJzYXRpb25cIl0pIHtcbiAgICAgICAgdGhpcy5yZXNldFVucmVhZENvdW50KCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogV2hlbiB1c2VyIHNlbmRzIG1lc3NhZ2UgY29udmVyc2F0aW9uTGlzdCBpcyB1cGRhdGVkIHdpdGggbGF0ZXN0IG1lc3NhZ2VcbiAgICAgICAqL1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLy8gZ2V0dGluZyBkZWZhdWx0IGNvbnZlcnNhdGlvbiBvcHRpb24gYW5kIGFkZGluZyBjYWxsYmFjayBpbiBpdFxuICBzZXRDb252ZXJzYXRpb25PcHRpb25zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zID0gQ29udmVyc2F0aW9uVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0T3B0aW9uKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICFlbGVtZW50Lm9uQ2xpY2sgJiZcbiAgICAgICAgZWxlbWVudC5pZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Db252ZXJzYXRpb25PcHRpb25zLmRlbGV0ZVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uT25DbGljaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gcmVzZXQgdW5yZWFkIGNvdW50XG4gIG9uQ2xpY2soY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soY29udmVyc2F0aW9uKTtcbiAgICB9XG4gIH1cbiAgLy8gc2V0IHVucmVhZCBjb3VudFxuICByZXNldFVucmVhZENvdW50KCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbikge1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo/LmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAvL25ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpPy5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHNldHMgcHJvcGVydHkgZnJvbSB0aGVtZSB0byBzdHlsZSBvYmplY3RcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRCYWRnZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRDb25maXJtRGlhbG9nU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0UmVjZWlwdFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgfTtcbiAgICB0aGlzLmljb25TdHlsZS5pY29uVGludCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRDb252ZXJzYXRpb25zU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0gbmV3IENvbnZlcnNhdGlvbnNTdHlsZSh7XG4gICAgICBsYXN0TWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGxhc3RNZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIHRocmVhZEluZGljYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cbiAgc2V0UmVjZWlwdFN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnJlY2VpcHRTdHlsZSB9O1xuICB9XG4gIHNldEJhZGdlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFkZ2VTdHlsZSA9IG5ldyBCYWRnZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmJhZGdlU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5iYWRnZVN0eWxlIH07XG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLmRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlLFxuICAgIH07XG4gIH1cbiAgLy8gY2hlY2tpbmcgaWYgdXNlciBoYXMgaGlzIG93biBjb25maWd1cmF0aW9uIGVsc2Ugd2lsbCB1c2UgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtPYmplY3Q9e319IGNvbmZpZ1xuICAgKiBAcGFyYW0gIHtPYmplY3R9IGRlZmF1bHRDb25maWc/XG4gICAqIEByZXR1cm5zIGRlZmF1bHRDb25maWdcbiAgICovXG4gIC8vIGNhbGxpbmcgc3VidGl0bGUgY2FsbGJhY2sgZnJvbSBjb25maWd1cmF0aW9uc1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbn0gY29udmVyc2F0aW9uXG4gICAqL1xuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgY292ZXJzYXRpb24gYmFzZWQgb24gdGhlIGNvbnZlcnNhdGlvblJlcXVlc3QgY29uZmlnXG4gICAqL1xuICBmZXRjaE5leHRDb252ZXJzYXRpb24oKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpICYmXG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2UpLmdldElkKCkgPT1cbiAgICAgICAgbWVzc2FnZT8uZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGF0dGFjaGVzIExpc3RlbmVycyBmb3IgdXNlciBhY3Rpdml0eSAsIGdyb3VwIGFjdGl2aXRpZXMgYW5kIGNhbGxpbmdcbiAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBhdHRhY2hMaXN0ZW5lcnMoY2FsbGJhY2s6IGFueSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSxcbiAgICAgICAgICAgICAgICBvbmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBvYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lLFxuICAgICAgICAgICAgICAgIG9mZmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgY2hhbmdlZFVzZXI6IGFueSxcbiAgICAgICAgICAgIG5ld1Njb3BlOiBhbnksXG4gICAgICAgICAgICBvbGRTY29wZTogYW55LFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAga2lja2VkVXNlcjogYW55LFxuICAgICAgICAgICAga2lja2VkQnk6IGFueSxcbiAgICAgICAgICAgIGtpY2tlZEZyb206IGFueVxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0ga2lja2VkVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbkZyb21NZXNzYWdlKGtpY2tlZEZyb20pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgIGJhbm5lZFVzZXI6IGFueSxcbiAgICAgICAgICAgIGJhbm5lZEJ5OiBhbnksXG4gICAgICAgICAgICBiYW5uZWRGcm9tOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGJhbm5lZFVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShiYW5uZWRGcm9tKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgIHVzZXJBZGRlZDogYW55LFxuICAgICAgICAgICAgdXNlckFkZGVkQnk6IGFueSxcbiAgICAgICAgICAgIHVzZXJBZGRlZEluOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBhbnksIGxlYXZpbmdVc2VyOiBhbnksIGdyb3VwOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgam9pbmVkVXNlcjogYW55LFxuICAgICAgICAgICAgam9pbmVkR3JvdXA6IGFueVxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICB0aGlzLmNhbGxMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgLy8gU0RLIGxpc3RlbmVyc1xuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIHRleHRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lZGlhTWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIG1lZGlhTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChmb3JtTWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgZm9ybU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGNhcmRNZXNzYWdlOiBDYXJkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGNhcmRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrQXNSZWFkKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdTdGFydGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ1N0YXJ0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmcpIHtcbiAgICAgICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yID0gdHlwaW5nSW5kaWNhdG9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAgICh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmZXRjaE5ld0NvbnZlcnNhdGlvbnMoKSB7XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW107XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oU3RhdGVzLmxvYWRlZCk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoZ3JvdXApXG4gICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbilcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGZXRjaGVzIENvbnZlcnNhdGlvbnMgRGV0YWlscyB3aXRoIGFsbCB0aGUgdXNlcnNcbiAgICovXG4gIGdldENvbnZlcnNhdGlvbiA9IChzdGF0ZXM6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciAmJlxuICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uICYmXG4gICAgICAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlcztcbiAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgdGhpcy5mZXRjaE5leHRDb252ZXJzYXRpb24oKVxuICAgICAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb252ZXJzYXRpb24uc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlcyA9PSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgICAuLi5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0Lmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMuZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBpc1JlY2VpcHREaXNhYmxlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBhbnkgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpO1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlUmVjZWlwdCAmJlxuICAgICAgbWVzc2FnZSAmJlxuICAgICAgIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAoIXRoaXMudHlwaW5nSW5kaWNhdG9yIHx8XG4gICAgICAgIChpdGVtPy51aWQgIT0gdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpICYmXG4gICAgICAgICAgaXRlbT8uZ3VpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udmVyc2F0aW9uIGxpc3QncyBsYXN0IG1lc3NhZ2UgLCBiYWRnZUNvdW50ICwgdXNlciBwcmVzZW5jZSBiYXNlZCBvbiBhY3Rpdml0aWVzIHByb3BhZ2F0ZWQgYnkgbGlzdGVuZXJzXG4gICAqL1xuICBjb252ZXJzYXRpb25VcGRhdGVkID0gKFxuICAgIGtleTogYW55LFxuICAgIGl0ZW06IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG9wdGlvbnMgPSBudWxsXG4gICkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vbmxpbmU6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVVzZXIoaXRlbSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX1JFQUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTElWRVJFRDoge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLlRFWFRfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRURJQV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVSZWNlaXB0KSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtNZXNzYWdlQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkFEREVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5KT0lORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uS0lDS0VEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uVU5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uU0NPUEVfQ0hBTkdFOlxuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfRURJVEVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FU1NBR0VfREVMRVRFRDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqL1xuICBtYXJrTWVzc2FnZUFzRGVsaXZlcmVkID0gKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgIC8vaWYgY2hhdCB3aW5kb3cgaXMgbm90IG9wZW4sIG1hcmsgbWVzc2FnZSBhcyBkZWxpdmVyZWRcbiAgICBpZiAoXG4gICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICApIHtcbiAgICAgIGlmIChcbiAgICAgICAgKCF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fFxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXJcbiAgICAgICAgICApPy5nZXRVaWQoKSAhPT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpKSAmJlxuICAgICAgICAhbWVzc2FnZS5oYXNPd25Qcm9wZXJ0eShcImRlbGl2ZXJlZEF0XCIpXG4gICAgICApIHtcbiAgICAgICAgQ29tZXRDaGF0Lm1hcmtBc0RlbGl2ZXJlZChtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICAoIXRoaXMuYWN0aXZlQ29udmVyc2F0aW9uIHx8XG4gICAgICAgICAgKFxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICApPy5nZXRHdWlkKCkgIT09IG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKSkgJiZcbiAgICAgICAgIW1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKVxuICAgICAgKSB7XG4gICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSByZWFkTWVzc2FnZVxuICAgKi9cbiAgZ2V0VWlueCA9ICgpID0+IHtcbiAgICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQoK25ldyBEYXRlKCkgLyAxMDAwKSk7XG4gIH07XG4gIG1hcmtBc1JlYWQocmVhZE1lc3NhZ2U6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25saXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIChcbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgICAgICAgKS5nZXRSZWNlaXZlcklkKCkgPT0gcmVhZE1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKClcbiAgICApO1xuICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iamVjdCE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb247XG4gICAgICBpZiAoXG4gICAgICAgICEoXG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtcbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbktleVxuICAgICAgICAgIF0uZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5nZXRSZWFkQXQoKVxuICAgICAgKSB7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdCA9IGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgKFxuICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iamVjdC5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLnNldFJlYWRBdChyZWFkTWVzc2FnZS5nZXRSZWFkQXQoKSk7XG4gICAgICAgIChcbiAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXRNdWlkKHRoaXMuZ2V0VWlueCgpKTtcbiAgICAgICAgY29udmVyc2F0aW9ubGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBuZXdDb252ZXJzYXRpb25PYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9ubGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFVwZGF0ZXMgRGV0YWlsIHdoZW4gdXNlciBjb21lcyBvbmxpbmUvb2ZmbGluZVxuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuVXNlcnxDb21ldENoYXQuR3JvdXB8bnVsbH0gdXNlclxuICAgKi9cbiAgdXBkYXRlVXNlcih1c2VyOiBDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cCB8IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgLy93aGVuIHVzZXIgdXBkYXRlc1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRVaWQoKSA9PT1cbiAgICAgICAgICAodXNlciBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uV2l0aE9iajogQ29tZXRDaGF0LlVzZXIgPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0LlVzZXI7XG4gICAgICAgIGNvbnZlcnNhdGlvbldpdGhPYmouc2V0U3RhdHVzKCh1c2VyIGFzIENvbWV0Q2hhdC5Vc2VyKS5nZXRTdGF0dXMoKSk7XG4gICAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPSBjb252ZXJzYXRpb25PYmo7XG4gICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRDb252ZXJzYXRpb25XaXRoKGNvbnZlcnNhdGlvbldpdGhPYmopO1xuICAgICAgICAobmV3Q29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKS5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gY29udmVyc2F0aW9ubGlzdDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICpcbiAgICogR2V0cyB0aGUgbGFzdCBtZXNzYWdlXG4gICAqIEBwYXJhbSBjb252ZXJzYXRpb25cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIG1ha2VMYXN0TWVzc2FnZShcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwge30gPSB7fVxuICApIHtcbiAgICBjb25zdCBuZXdNZXNzYWdlID0gbWVzc2FnZTtcbiAgICByZXR1cm4gbmV3TWVzc2FnZTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZTogQ29tZXRDaGF0LkFjdGlvbiwgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXApIHtcblxuICAgICAgY29uc3QgaXNTYW1lR3JvdXAgPSAobWVzc2FnZS5nZXRSZWNlaXZlcigpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpID09PVxuICAgICAgICAobWVzc2FnZS5nZXRBY3Rpb25Gb3IoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKTtcblxuICAgICAgaWYgKGlzU2FtZUdyb3VwKSB7XG4gICAgICAgIGxldCB1cGRhdGVkR3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgICAgdXBkYXRlZEdyb3VwLnNldE1lbWJlcnNDb3VudCgobWVzc2FnZS5nZXRBY3Rpb25Gb3IoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldE1lbWJlcnNDb3VudCgpKTtcbiAgICAgICAgY29udmVyc2F0aW9uLnNldENvbnZlcnNhdGlvbldpdGgodXBkYXRlZEdyb3VwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIFVwZGF0ZXMgQ29udmVyc2F0aW9ucyBhcyBUZXh0L0N1c3RvbSBNZXNzYWdlcyBhcmUgcmVjZWl2ZWRcbiAgICogQHBhcmFtXG4gICAqXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IG5vdGlmaWNhdGlvblxuICAgKi9cbiAgdXBkYXRlQ29udmVyc2F0aW9uKFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICBub3RpZmljYXRpb246IGJvb2xlYW4gPSB0cnVlXG4gICkge1xuICAgIGxldCBtZXRhZGF0YTogYW55O1xuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkN1c3RvbU1lc3NhZ2UpIHtcbiAgICAgIG1ldGFkYXRhID0gbWVzc2FnZS5nZXRNZXRhZGF0YSgpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdGhpcy5tYWtlQ29udmVyc2F0aW9uKG1lc3NhZ2UpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gcmVzcG9uc2UuY29udmVyc2F0aW9uS2V5O1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgICByZXNwb25zZS5jb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgY29uc3QgY29udmVyc2F0aW9uTGlzdCA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgICAgICAvLyBpZiBzZW5kZXIgaXMgbm90IGxvZ2dlZCBpbiB1c2VyIHRoZW4gIGluY3JlbWVudCBjb3VudFxuICAgICAgICAgICAgbGV0IHVucmVhZE1lc3NhZ2VDb3VudCA9XG4gICAgICAgICAgICAgICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSB8fFxuICAgICAgICAgICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PSBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSkgJiZcbiAgICAgICAgICAgICAgICAoIW1ldGFkYXRhIHx8XG4gICAgICAgICAgICAgICAgICAhbWV0YWRhdGEuaGFzT3duUHJvcGVydHkoXCJpbmNyZW1lbnRVbnJlYWRDb3VudFwiKSB8fFxuICAgICAgICAgICAgICAgICAgbWV0YWRhdGEuaW5jcmVtZW50VW5yZWFkQ291bnQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICA/IHRoaXMubWFrZVVucmVhZE1lc3NhZ2VDb3VudChjb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICAgICAgOiB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKSAtIDE7XG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmo6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IHRoaXMubWFrZUxhc3RNZXNzYWdlKFxuICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmpcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2UsIG5ld0NvbnZlcnNhdGlvbk9iailcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0NvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KHVucmVhZE1lc3NhZ2VDb3VudCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGxhc3RNZXNzYWdlT2JqLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCB0aW1lc0xvZ2dlZEluVXNlcklzTWVudGlvbmVkID0gMDtcbiAgICAgICAgICAgICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbGFzdE1lc3NhZ2VPYmouZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoXG4gICAgICAgICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICAgICAgICBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQrKztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvL0NvbW1lbnRlZCBmb3Igbm93LiBUbyBiZSB1c2VkIGluIFVNQ1xuICAgICAgICAgICAgICAvLyBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KFxuICAgICAgICAgICAgICAvLyAgIGxhc3RNZXNzYWdlT2JqLmdldE1lbnRpb25lZFVzZXJzKClcbiAgICAgICAgICAgICAgLy8gICAgID8gbmV3Q29udmVyc2F0aW9uT2JqLmdldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgpICtcbiAgICAgICAgICAgICAgLy8gICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWRcbiAgICAgICAgICAgICAgLy8gICAgIDogMFxuICAgICAgICAgICAgICAvLyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEpO1xuICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBuZXdDb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgaW5jcmVtZW50Q291bnQgPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA/IDEgOiAwXG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmogPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5BY3Rpb24pIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudChpbmNyZW1lbnRDb3VudCk7XG4gICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnVuc2hpZnQoY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSBjb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoYy5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBOdW1iZXIobWVzc2FnZVJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpXG4gICAgKTtcbiAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgY29udmVyc2F0aW9uT2JqID0gY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICkge1xuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0RGVsaXZlcmVkQXQoTnVtYmVyKHRoaXMuZ2V0VWlueCgpKSk7XG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBjb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgVGhlIENvdW50IG9mIFVucmVhZCBNZXNzYWdlc1xuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGNvbnZlcnNhdGlvblxuICAgKiBAcGFyYW0gIHthbnl9IG9wZXJhdG9yXG4gICAqL1xuICBtYWtlVW5yZWFkTWVzc2FnZUNvdW50KFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBvcGVyYXRvcjogYW55ID0gbnVsbFxuICApIHtcbiAgICBpZiAoT2JqZWN0LmtleXMoY29udmVyc2F0aW9uKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBsZXQgdW5yZWFkTWVzc2FnZUNvdW50OiBudW1iZXIgPSBjb252ZXJzYXRpb24uZ2V0VW5yZWFkTWVzc2FnZUNvdW50KCk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICkge1xuICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ICs9IDE7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKS5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCkgPT09XG4gICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpKSB8fFxuICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmhhc093blByb3BlcnR5KFwidWlkXCIpICYmXG4gICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkuaGFzT3duUHJvcGVydHkoXCJ1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpID09PVxuICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3BlcmF0b3IgJiYgb3BlcmF0b3IgPT09IFwiZGVjcmVtZW50XCIpIHtcbiAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gdW5yZWFkTWVzc2FnZUNvdW50ID8gdW5yZWFkTWVzc2FnZUNvdW50IC0gMSA6IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSB1bnJlYWRNZXNzYWdlQ291bnQgKyAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5yZWFkTWVzc2FnZUNvdW50O1xuICB9XG4gIC8qKlxuICAgKiBDaGFuZ2VzIGRldGFpbCBvZiBjb252ZXJzYXRpb25zXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT0gbWVzc2FnZT8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgY29udmVyc2F0aW9uS2V5OiBjb252ZXJzYXRpb25LZXksXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqOiBjb252ZXJzYXRpb24sXG4gICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIuZ2V0Q29udmVyc2F0aW9uRnJvbU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGluc3RhbmNlb2YgQ29tZXRDaGF0Lkdyb3VwICYmXG4gICAgICAgICAgICAgICEoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICAgKS5nZXRTY29wZSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgICAgICkuc2V0SGFzSm9pbmVkKHRydWUpO1xuICAgICAgICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLnNldFNjb3BlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25LZXk6IC0xLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmo6IGNvbnZlcnNhdGlvbixcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBDb252ZXJzYXRpb24gVmlldyB3aGVuIG1lc3NhZ2UgaXMgZWRpdGVkIG9yIGRlbGV0ZWRcbiAgICovXG4gIGNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICAgICAgICAgIGlmIChsYXN0TWVzc2FnZU9iai5nZXRJZCgpID09PSBtZXNzYWdlLmdldElkKCkpIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIElmIFVzZXIgc2Nyb2xscyB0byB0aGUgYm90dG9tIG9mIHRoZSBjdXJyZW50IENvbnZlcnNhdGlvbiBsaXN0IHRoYW4gZmV0Y2ggbmV4dCBpdGVtcyBvZiB0aGUgQ29udmVyc2F0aW9uIGxpc3QgYW5kIGFwcGVuZFxuICAgKiBAcGFyYW0gRXZlbnRcbiAgICovXG4gIC8qKlxuICAgKiBQbGF5cyBBdWRpbyBXaGVuIE1lc3NhZ2UgaXMgUmVjZWl2ZWRcbiAgICovXG4gIHBsYXlBdWRpbygpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIGlmICh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheSh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZUZyb21PdGhlclxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLypcbiAgICogVXBkYXRlcyB0aGUgY29udmVzYXRpb24gbGlzdCB3aGVuIGRlbGV0ZWQuXG4gICAqIEFkZGluZyBDb252ZXJzYXRpb24gT2JqZWN0IHRvIENvbWV0Y2hhdFNlcnZpY2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCkge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudD8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogc2hvd2luZyBkaWFsb2cgZm9yIGNvbmZpcm0gYW5kIGNhbmNlbFxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHNob3dDb25maXJtYXRpb25EaWFsb2cgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBjb252ZXJzYXRpb247XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbk9wdGlvbkNsaWNrKGV2ZW50OiBhbnksIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBvcHRpb246IENvbWV0Q2hhdE9wdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmRhdGE7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICBpZiAob3B0aW9uKSB7XG4gICAgICBvcHRpb24ub25DbGljayEoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIHNob3cgY29uZmlybSBkaWFsb2cgc2NyZWVuXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdG9uXG4gICAqL1xuICAvLyBjaGVjayBpcyB0aGVyZSBpcyBhbnkgYWN0aXZlIGNvbnZlcnNhdGlvbiBhbmQgbWFyayBpdCBhcyBhY3RpdmVcbiAgZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiBhcyBhbnkpPy5jb252ZXJzYXRpb25JZCA9PVxuICAgICAgICAoY29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBoYW5kbGUgY29uZmlybSBkaWFsb2cgcmVzcG9uc2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB2YWx1ZVxuICAgKi9cbiAgLy8gY2FsbGluZyBjb21ldGNoYXQuZGVsZXRlQ29udmVyc2F0aW9uIG1ldGhvZFxuICBkZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoO1xuICAgICAgbGV0IGNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICAgIGlmIChcbiAgICAgICAgY29udmVyc2F0aW9uVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICApIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuZGVsZXRlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbldpdGgsIGNvbnZlcnNhdGlvblR5cGUpLnRoZW4oXG4gICAgICAgIChkZWxldGVkQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLmNjQ29udmVyc2F0aW9uRGVsZXRlZC5uZXh0KFxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCFcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdCh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKTtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvLyBleHBvc2VkIG1ldGhvZHMgdG8gdXNlcnMuXG4gIHVwZGF0ZUxhc3RNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICB9XG4gIHJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uKTtcbiAgfVxuICBzdHlsZXM6IGFueSA9IHtcbiAgICB3cmFwcGVyU3R5bGU6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuaGVpZ2h0LFxuICAgICAgICB3aWR0aDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUud2lkdGgsXG4gICAgICAgIGJvcmRlcjpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5ib3JkZXIgfHxcbiAgICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG4gIHN1YnRpdGxlU3R5bGUgPSAoY29udmVyc2F0aW9uOiBhbnkpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnR5cGluZ0luZGljYXRvciAmJlxuICAgICAgKCh0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/LnVpZCkgfHxcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpID09XG4gICAgICAgIGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25XaXRoPy5ndWlkKVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudHlwaW5nSW5kaWN0b3JUZXh0Q29sb3IsXG4gICAgICAgIGNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sYXN0TWVzc2FnZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGl0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc1wiIFtuZ1N0eWxlXT1cInN0eWxlcy53cmFwcGVyU3R5bGUoKVwiPlxuICA8Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cImlzRGlhbG9nT3BlblwiPlxuICAgIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cImNvbmZpcm1EaWFsb2dUaXRsZVwiXG4gICAgICBbbWVzc2FnZVRleHRdPVwiY29uZmlybURpYWxvZ01lc3NhZ2VcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxCdXR0b25UZXh0XCJcbiAgICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJjb25maXJtQnV0dG9uVGV4dFwiXG4gICAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIlxuICAgICAgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlXCI+XG4gICAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG4gIDwvY29tZXRjaGF0LWJhY2tkcm9wPlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbc3RhdGVdPVwic3RhdGVcIiBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCJcbiAgICBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1ZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIiBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIlxuICAgIFtlcnJvclZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cImdldENvbnZlcnNhdGlvblwiXG4gICAgW2xpc3RdPVwiY29udmVyc2F0aW9uTGlzdFwiXG4gICAgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiPjwvY29tZXRjaGF0LWxpc3Q+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNvbnZlcnNhdGlvbj5cbiAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUoY29udmVyc2F0aW9uKVwiXG4gICAgW2lkXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uSWRcIlxuICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKVwiXG4gICAgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25DbGljayhjb252ZXJzYXRpb24pXCJcbiAgICBbdGl0bGVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgIFthdmF0YXJVUkxdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5hdmF0YXJcIlxuICAgIFthdmF0YXJOYW1lXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8ubmFtZVwiPlxuICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgY29udmVyc2F0aW9uU3VidGl0bGVcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udmVyc2F0aW9uU3VidGl0bGU+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zdWJ0aXRsZS12aWV3IFwiIHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3RocmVhZHZpZXdcIlxuICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZT8ucGFyZW50TWVzc2FnZUlkXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJpdGVtVGhyZWFkSW5kaWNhdG9yU3R5bGUoKVwiXG4gICAgICAgICAgICBbdGV4dF09XCJ0aHJlYWRJbmRpY2F0b3JUZXh0XCI+IDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtaWNvbiBbVVJMXT1cInRocmVhZEljb25VUkxcIlxuICAgICAgICAgICAgW2ljb25TdHlsZV09XCJpY29uU3R5bGVcIj48L2NvbWV0Y2hhdC1pY29uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc3VidGl0bGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fcmVhZHJlY2VpcHRcIlxuICAgICAgICAgICAgKm5nSWY9XCJpc1JlY2VpcHREaXNhYmxlKGNvbnZlcnNhdGlvbilcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVjZWlwdCBbcmVjZWlwdF09XCJnZXRNZXNzYWdlUmVjZWlwdChjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJyZWNlaXB0U3R5bGVcIiBbc2VudEljb25dPVwic2VudEljb25cIlxuICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiIFtkZWxpdmVyZWRJY29uXT1cImRlbGl2ZXJlZEljb25cIlxuICAgICAgICAgICAgICBbcmVhZEljb25dPVwicmVhZEljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKGNvbnZlcnNhdGlvbilcIiBjbGFzcz1cImNjLXN1YnRpdGxlX190ZXh0XCJcbiAgICAgICAgICAgIFtpbm5lckhUTUxdPVwic2V0U3VidGl0bGUoY29udmVyc2F0aW9uKVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fb3B0aW9uc3ZpZXdcIlxuICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgIDxkaXYgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudCxjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICBbbWVudUxpc3RTdHlsZV09XCJtZW51c3R5bGVcIj5cblxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgKm5nSWY9XCIhb3B0aW9ucyAmJiBjb252ZXJzYXRpb25PcHRpb25zXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cImNvbnZlcnNhdGlvbk9wdGlvbnNcIlxuICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwib25PcHRpb25DbGljaygkZXZlbnQsY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgW21lbnVMaXN0U3R5bGVdPVwibWVudXN0eWxlXCI+XG5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3RhaWwtdmlld1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInRhaWxfX3ZpZXdcIiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbZGF0ZVN0eWxlXT1cImRhdGVTdHlsZVwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2U/LnNlbnRBdFwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJnZXREYXRlKClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX2JhZGdlXCI+XG4gICAgICAgICAgPCEtLSA8Y29tZXRjaGF0LWljb24gKm5nSWY9XCJjb252ZXJzYXRpb24/LmdldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgpXCIgW25nU3R5bGVdPVwiZ2V0VW5yZWFkTWVudGlvbnNJY29uU3R5bGUoKVwiIFtpY29uU3R5bGVdPWdldE1lbnRpb25JY29uU3R5bGUoKSBbVVJMXT1cIm1lbnRpb25zSWNvblVSTFwiPjwvY29tZXRjaGF0LWljb24+IC0tPlxuICAgICAgICAgIDxjb21ldGNoYXQtYmFkZ2UgW2NvdW50XT1cImNvbnZlcnNhdGlvbj8udW5yZWFkTWVzc2FnZUNvdW50XCJcbiAgICAgICAgICAgIFtiYWRnZVN0eWxlXT1cImJhZGdlU3R5bGVcIj48L2NvbWV0Y2hhdC1iYWRnZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zZWxlY3Rpb24tdmlld1wiXG4gICAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCI+XG4gICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvblxuICAgICAgICAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb24sJGV2ZW50KVwiPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2ICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiPlxuICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveFxuICAgICAgICAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG48L25nLXRlbXBsYXRlPlxuIl19