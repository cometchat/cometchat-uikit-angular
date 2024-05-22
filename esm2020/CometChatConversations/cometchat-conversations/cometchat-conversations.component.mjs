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
CometChatConversationsComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatConversationsComponent, selector: "cometchat-conversations", inputs: { subtitleView: "subtitleView", title: "title", options: "options", searchPlaceHolder: "searchPlaceHolder", disableUsersPresence: "disableUsersPresence", disableReceipt: "disableReceipt", disableTyping: "disableTyping", deliveredIcon: "deliveredIcon", readIcon: "readIcon", errorIcon: "errorIcon", datePattern: "datePattern", onError: "onError", sentIcon: "sentIcon", privateGroupIcon: "privateGroupIcon", protectedGroupIcon: "protectedGroupIcon", passwordGroupIcon: "passwordGroupIcon", customSoundForMessages: "customSoundForMessages", activeConversation: "activeConversation", searchIconURL: "searchIconURL", hideSearch: "hideSearch", conversationsRequestBuilder: "conversationsRequestBuilder", emptyStateView: "emptyStateView", onSelect: "onSelect", loadingIconURL: "loadingIconURL", errorStateView: "errorStateView", loadingStateView: "loadingStateView", emptyStateText: "emptyStateText", errorStateText: "errorStateText", titleAlignment: "titleAlignment", listItemView: "listItemView", menu: "menu", hideSeparator: "hideSeparator", searchPlaceholder: "searchPlaceholder", hideError: "hideError", selectionMode: "selectionMode", disableSoundForMessages: "disableSoundForMessages", confirmDialogTitle: "confirmDialogTitle", confirmButtonText: "confirmButtonText", cancelButtonText: "cancelButtonText", confirmDialogMessage: "confirmDialogMessage", onItemClick: "onItemClick", deleteConversationDialogStyle: "deleteConversationDialogStyle", backdropStyle: "backdropStyle", badgeStyle: "badgeStyle", dateStyle: "dateStyle", conversationsStyle: "conversationsStyle", listItemStyle: "listItemStyle", statusIndicatorStyle: "statusIndicatorStyle", typingIndicatorText: "typingIndicatorText", threadIndicatorText: "threadIndicatorText", avatarStyle: "avatarStyle", receiptStyle: "receiptStyle", loggedInUser: "loggedInUser", disableMentions: "disableMentions", textFormatters: "textFormatters" }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-conversations\" [ngStyle]=\"styles.wrapperStyle()\">\n  <cometchat-backdrop [backdropStyle]=\"backdropStyle\" *ngIf=\"isDialogOpen\">\n    <cometchat-confirm-dialog [title]=\"confirmDialogTitle\"\n      [messageText]=\"confirmDialogMessage\" [cancelButtonText]=\"cancelButtonText\"\n      [confirmButtonText]=\"confirmButtonText\"\n      (cc-confirm-clicked)=\"onConfirmClick()\"\n      (cc-cancel-clicked)=\"onCancelClick()\"\n      [confirmDialogStyle]=\"deleteConversationDialogStyle\">\n    </cometchat-confirm-dialog>\n  </cometchat-backdrop>\n  <div class=\"cc-conversations__menus\" *ngIf=\"menu\">\n\n    <ng-container *ngTemplateOutlet=\"menu\">\n    </ng-container>\n\n  </div>\n  <cometchat-list [state]=\"state\" [searchIconURL]=\"searchIconURL\"\n    [hideError]=\"hideError\" [emptyStateText]=\"emptyStateText\"\n    [loadingIconURL]=\"loadingIconURL\" [titleAlignment]=\"titleAlignment\"\n    [loadingView]=\"loadingStateView\" [listStyle]=\"listStyle\"\n    [emptyStateView]=\"emptyStateView\" [errorStateText]=\"errorStateText\"\n    [errorView]=\"errorStateView\" [onScrolledToBottom]=\"getConversation\"\n    [list]=\"conversationList\"\n    [listItemView]=\"listItemView ? listItemView : listItem\" [title]=\"title\"\n    [hideSearch]=\"hideSearch\"></cometchat-list>\n</div>\n<ng-template #listItem let-conversation>\n  <cometchat-list-item [hideSeparator]=\"hideSeparator\"\n    [avatarStyle]=\"avatarStyle\"\n    [statusIndicatorStyle]=\"setStatusIndicatorStyle(conversation)\"\n    [id]=\"conversation?.conversationId\"\n    [isActive]=\"getActiveConversation(conversation)\"\n    (cc-listitem-clicked)=\"onClick(conversation)\"\n    [title]=\"conversation?.conversationWith?.name\"\n    [statusIndicatorIcon]=\"checkGroupType(conversation)\"\n    [statusIndicatorColor]=\"checkStatusType(conversation)\"\n    [listItemStyle]=\"listItemStyle\"\n    [avatarURL]=\"conversation?.conversationWith?.avatar\"\n    [avatarName]=\"conversation?.conversationWith?.name\">\n    <div slot=\"subtitleView\" *ngIf=\"subtitleView;else conversationSubtitle\">\n      <ng-container *ngTemplateOutlet=\"subtitleView\">\n      </ng-container>\n    </div>\n    <ng-template #conversationSubtitle>\n\n      <div class=\"cc-conversations__subtitle-view \" slot=\"subtitleView\">\n        <div class=\"cc-conversations__threadview\"\n          *ngIf=\"conversation?.lastMessage?.parentMessageId\">\n          <cometchat-label [labelStyle]=\"itemThreadIndicatorStyle()\"\n            [text]=\"threadIndicatorText\"> </cometchat-label>\n          <cometchat-icon [URL]=\"threadIconURL\"\n            [iconStyle]=\"iconStyle\"></cometchat-icon>\n\n        </div>\n        <div class=\"cc-conversations__subtitle\">\n          <div class=\"cc-conversations__readreceipt\"\n            *ngIf=\"isReceiptDisable(conversation)\">\n            <cometchat-receipt [receipt]=\"getMessageReceipt(conversation)\"\n              [receiptStyle]=\"receiptStyle\" [sentIcon]=\"sentIcon\"\n              [errorIcon]=\"errorIcon\" [deliveredIcon]=\"deliveredIcon\"\n              [readIcon]=\"readIcon\"></cometchat-receipt>\n          </div>\n\n          <div [ngStyle]=\"subtitleStyle(conversation)\" class=\"cc-subtitle__text\"\n            [innerHTML]=\"setSubtitle(conversation)\"></div>\n        </div>\n\n      </div>\n    </ng-template>\n    <div slot=\"menuView\" class=\"cc-conversations__optionsview\"\n      *ngIf=\"selectionMode == selectionmodeEnum.none\">\n      <div *ngIf=\"options\">\n        <cometchat-menu-list [data]=\"options(conversation)\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n      <div *ngIf=\"!options && conversationOptions\">\n        <cometchat-menu-list [data]=\"conversationOptions\"\n          (cc-menu-clicked)=\"onOptionClick($event,conversation)\"\n          [menuListStyle]=\"menustyle\">\n\n        </cometchat-menu-list>\n      </div>\n    </div>\n    <div slot=\"tailView\" class=\"cc-conversations__tail-view\">\n      <div class=\"tail__view\" *ngIf=\"selectionMode == selectionmodeEnum.none\">\n        <div class=\"cc-date\">\n          <cometchat-date [dateStyle]=\"dateStyle\"\n            [timestamp]=\"conversation?.lastMessage?.sentAt\"\n            [pattern]=\"getDate()\"></cometchat-date>\n        </div>\n        <div class=\"cc-conversations__badge\">\n          <!-- <cometchat-icon *ngIf=\"conversation?.getUnreadMentionInMessageCount()\" [ngStyle]=\"getUnreadMentionsIconStyle()\" [iconStyle]=getMentionIconStyle() [URL]=\"mentionsIconURL\"></cometchat-icon> -->\n          <cometchat-badge [count]=\"conversation?.unreadMessageCount\"\n            [badgeStyle]=\"badgeStyle\"></cometchat-badge>\n        </div>\n      </div>\n      <div class=\"cc-conversations__selection-view\"\n        *ngIf=\"selectionMode != selectionmodeEnum.none\">\n        <ng-container *ngTemplateOutlet=\"tailView\">\n        </ng-container>\n      </div>\n    </div>\n  </cometchat-list-item>\n  <ng-template #tailView>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.single\">\n      <cometchat-radio-button\n        (cc-radio-button-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-radio-button>\n    </div>\n    <div *ngIf=\"selectionMode == selectionmodeEnum.multiple\">\n      <cometchat-checkbox\n        (cc-checkbox-changed)=\"onConversationSelected(conversation,$event)\"></cometchat-checkbox>\n    </div>\n  </ng-template>\n</ng-template>\n", styles: [".cc-conversations{height:100%;width:100%;box-sizing:border-box;margin-bottom:16px;position:relative}.cc-conversations__selection-view{position:relative}.tail__view{display:flex;flex-direction:column;justify-content:flex-start;align-items:center}.cc-subtitle__text{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.cc-conversations__menus{position:absolute;right:12px;padding:4px;cursor:pointer}.cc-menus__icon{height:24px;width:24px}.cc-conversations__subtitle-view{display:flex;align-items:center;width:90%;flex-direction:column;justify-content:flex-start}.cc-conversations__subtitle{display:flex;justify-content:flex-start;width:100%;align-items:center;min-height:22px}.cc-conversations__threadview{height:12px;display:flex;justify-content:flex-start;width:100%;align-items:center}.cc-conversations__badge{display:flex;align-items:flex-end;justify-content:flex-end;width:100%;padding-right:8px}cometchat-list-item{padding:0 8px}\n"], components: [{ type: i3.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i4.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LWNvbnZlcnNhdGlvbnMuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRDb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC50cyIsIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2NoYXQtdWlraXQtYW5ndWxhci9zcmMvQ29tZXRDaGF0Q29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFDTCxXQUFXLEVBRVgsVUFBVSxFQUNWLGtCQUFrQixFQUNsQixTQUFTLEVBRVQsYUFBYSxFQUNiLFlBQVksR0FDYixNQUFNLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCxxQkFBcUIsRUFFckIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUNqQixrQkFBa0IsRUFDbEIsU0FBUyxFQUNULG1CQUFtQixHQUNwQixNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFFTCxtQkFBbUIsRUFDbkIsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFFdEIsdUJBQXVCLEVBQ3ZCLG1CQUFtQixFQUVuQixZQUFZLEVBT1osYUFBYSxFQUNiLGFBQWEsRUFDYixNQUFNLEVBQ04sY0FBYyxFQUNkLFVBQVUsRUFDVixRQUFRLEVBR1IscUJBQXFCLEdBQ3RCLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixTQUFTLEVBRVQsS0FBSyxHQU9OLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5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eEIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBR0csV0FBVztzQkFBbkIsS0FBSztnQkFDRyw2QkFBNkI7c0JBQXJDLEtBQUs7Z0JBZ0JHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBTUcsVUFBVTtzQkFBbEIsS0FBSztnQkFRRyxTQUFTO3NCQUFqQixLQUFLO2dCQUlHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFNRyxhQUFhO3NCQUFyQixLQUFLO2dCQUlHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFLRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkErR0csWUFBWTtzQkFBcEIsS0FBSztnQkFHRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5cbmltcG9ydCB7XG4gIEF2YXRhclN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBCYWRnZVN0eWxlLFxuICBDb25maXJtRGlhbG9nU3R5bGUsXG4gIERhdGVTdHlsZSxcbiAgSWNvblN0eWxlLFxuICBMaXN0SXRlbVN0eWxlLFxuICBSZWNlaXB0U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBEb21TYW5pdGl6ZXIsIFNhZmVIdG1sIH0gZnJvbSBcIkBhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXJcIjtcbmltcG9ydCB7XG4gIEJhc2VTdHlsZSxcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIENvbnZlcnNhdGlvblV0aWxzLFxuICBDb252ZXJzYXRpb25zU3R5bGUsXG4gIExpc3RTdHlsZSxcbiAgTWVzc2FnZVJlY2VpcHRVdGlscyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBDYXJkTWVzc2FnZSxcbiAgQ29tZXRDaGF0Q2FsbEV2ZW50cyxcbiAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgQ29tZXRDaGF0VXNlckV2ZW50cyxcbiAgQ3VzdG9tSW50ZXJhY3RpdmVNZXNzYWdlLFxuICBEYXRlUGF0dGVybnMsXG4gIEZvcm1NZXNzYWdlLFxuICBJR3JvdXBMZWZ0LFxuICBJR3JvdXBNZW1iZXJBZGRlZCxcbiAgSUdyb3VwTWVtYmVyS2lja2VkQmFubmVkLFxuICBJR3JvdXBNZW1iZXJTY29wZUNoYW5nZWQsXG4gIElNZXNzYWdlcyxcbiAgTWVzc2FnZVN0YXR1cyxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgU3RhdGVzLFxuICBUaXRsZUFsaWdubWVudCxcbiAgZm9udEhlbHBlcixcbiAgbG9jYWxpemUsXG4gIFNjaGVkdWxlck1lc3NhZ2UsXG4gIFVzZXJQcmVzZW5jZVBsYWNlbWVudCxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBIb3N0QmluZGluZyxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVJS2l0IH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9Db21ldENoYXRVSWtpdC9Db21ldENoYXRVSUtpdFwiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRDb252ZXJzYXRpb24gaXMgYSB3cmFwcGVyIGNvbXBvbmVudCBjb25zaXN0cyBvZiBDb21ldENoYXRMaXN0QmFzZUNvbXBvbmVudCBhbmQgQ29udmVyc2F0aW9uTGlzdENvbXBvbmVudC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtY29udmVyc2F0aW9uc1wiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1jb252ZXJzYXRpb25zLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtY29udmVyc2F0aW9ucy5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdENvbnZlcnNhdGlvbnNDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgc3VidGl0bGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgdGl0bGU6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0hBVFNcIik7IC8vVGl0bGUgb2YgdGhlIGNvbXBvbmVudFxuICBASW5wdXQoKSBvcHRpb25zITpcbiAgICB8ICgoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiBDb21ldENoYXRPcHRpb25bXSlcbiAgICB8IG51bGw7XG4gIEBJbnB1dCgpIHNlYXJjaFBsYWNlSG9sZGVyOiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNFQVJDSFwiKTsgLy8gcGxhY2Vob2xkZXIgdGV4dCBvZiBzZWFyY2ggaW5wdXRcbiAgQElucHV0KCkgZGlzYWJsZVVzZXJzUHJlc2VuY2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZGlzYWJsZVJlY2VpcHQ6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRlbGl2ZXJlZEljb246IHN0cmluZyA9IFwiYXNzZXRzL21lc3NhZ2UtZGVsaXZlcmVkLnN2Z1wiO1xuICBASW5wdXQoKSByZWFkSWNvbjogc3RyaW5nID0gXCJhc3NldHMvbWVzc2FnZS1yZWFkLnN2Z1wiO1xuICBASW5wdXQoKSBlcnJvckljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhcm5pbmctc21hbGwuc3ZnXCI7XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMuRGF5RGF0ZVRpbWU7XG4gIEBJbnB1dCgpIG9uRXJyb3I6IChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIHNlbnRJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9tZXNzYWdlLXNlbnQuc3ZnXCI7XG4gIEBJbnB1dCgpIHByaXZhdGVHcm91cEljb246IHN0cmluZyA9IFwiYXNzZXRzL1ByaXZhdGUuc3ZnXCI7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKiBcbiAgICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjcgZHVlIHRvIG5ld2VyIHByb3BlcnR5ICdwYXNzd29yZEdyb3VwSWNvbicuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAgKi9cbiAgQElucHV0KCkgcHJvdGVjdGVkR3JvdXBJY29uOiBzdHJpbmcgPSBcImFzc2V0cy9Mb2NrZWQuc3ZnXCI7XG4gIEBJbnB1dCgpIHBhc3N3b3JkR3JvdXBJY29uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGFjdGl2ZUNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IG51bGwgPSBudWxsOyAvL3NlbGVjdGVkIGNvbnZlcnNhdGlvblxuICBASW5wdXQoKSBzZWFyY2hJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zZWFyY2guc3ZnXCI7IC8vaW1hZ2UgVVJMIG9mIHRoZSBzZWFyY2ggaWNvblxuICBASW5wdXQoKSBoaWRlU2VhcmNoOiBib29sZWFuID0gdHJ1ZTsgLy9zd2l0Y2ggb24vZmYgc2VhcmNoIGlucHV0XG4gIEBJbnB1dCgpIGNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdEJ1aWxkZXI7XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25TZWxlY3QhOiAoXG4gICAgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLFxuICAgIHNlbGVjdGVkOiBib29sZWFuXG4gICkgPT4gdm9pZDtcbiAgQElucHV0KCkgbG9hZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NwaW5uZXIuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9yU3RhdGVWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbG9hZGluZ1N0YXRlVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX0NIQVRTX0ZPVU5EXCIpO1xuICBASW5wdXQoKSBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIEBJbnB1dCgpIHRpdGxlQWxpZ25tZW50OiBUaXRsZUFsaWdubWVudCA9IFRpdGxlQWxpZ25tZW50LmxlZnQ7XG5cbiAgQElucHV0KCkgbGlzdEl0ZW1WaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgbWVudSE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGhpZGVTZXBhcmF0b3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZyA9IGxvY2FsaXplKFwiU0VBUkNIXCIpO1xuICBASW5wdXQoKSBoaWRlRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgc2VsZWN0aW9uTW9kZTogU2VsZWN0aW9uTW9kZSA9IFNlbGVjdGlvbk1vZGUubm9uZTtcbiAgQElucHV0KCkgZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgY29uZmlybURpYWxvZ1RpdGxlID0gbG9jYWxpemUoXCJERUxFVEVfQ09OVkVSU0FUSU9OXCIpO1xuICBASW5wdXQoKSBjb25maXJtQnV0dG9uVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJERUxFVEVcIik7XG4gIEBJbnB1dCgpIGNhbmNlbEJ1dHRvblRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiQ0FOQ0VMXCIpO1xuICBASW5wdXQoKSBjb25maXJtRGlhbG9nTWVzc2FnZTogc3RyaW5nID0gbG9jYWxpemUoXG4gICAgXCJXT1VMRF9fWU9VX0xJS0VfVE9fREVMRVRFX1RISVNfQ09OVkVSU0FUSU9OXCJcbiAgKTtcbiAgQElucHV0KCkgb25JdGVtQ2xpY2shOiAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB2b2lkO1xuICBASW5wdXQoKSBkZWxldGVDb252ZXJzYXRpb25EaWFsb2dTdHlsZTogQ29uZmlybURpYWxvZ1N0eWxlID0ge1xuICAgIGNvbmZpcm1CdXR0b25CYWNrZ3JvdW5kOiBcIlwiLFxuICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IFwiXCIsXG4gICAgY29uZmlybUJ1dHRvblRleHRDb2xvcjogXCJcIixcbiAgICBjb25maXJtQnV0dG9uVGV4dEZvbnQ6IFwiXCIsXG4gICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOiBcIlwiLFxuICAgIGNhbmNlbEJ1dHRvblRleHRGb250OiBcIlwiLFxuICAgIHRpdGxlRm9udDogXCJcIixcbiAgICB0aXRsZUNvbG9yOiBcIlwiLFxuICAgIG1lc3NhZ2VUZXh0Rm9udDogXCJcIixcbiAgICBtZXNzYWdlVGV4dENvbG9yOiBcIlwiLFxuICAgIGJhY2tncm91bmQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIjFweCBzb2xpZCAjZjJmMmYyXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuICBASW5wdXQoKSBiYWRnZVN0eWxlOiBCYWRnZVN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI1cHhcIixcbiAgICBoZWlnaHQ6IFwiMTVweFwiLFxuICAgIGJhY2tncm91bmQ6IFwiIzVhYWVmZlwiLFxuICAgIHRleHRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgIHRleHRGb250OiBcIjQwMCAxM3B4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgfTtcbiAgQElucHV0KCkgZGF0ZVN0eWxlOiBEYXRlU3R5bGUgPSB7XG4gICAgdGV4dEZvbnQ6IFwiNDAwIDExcHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICB0ZXh0Q29sb3I6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICB9O1xuICBASW5wdXQoKSBjb252ZXJzYXRpb25zU3R5bGU6IENvbnZlcnNhdGlvbnNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCJcIixcbiAgICBoZWlnaHQ6IFwiXCIsXG4gICAgYm9yZGVyOiBcIlwiLFxuICAgIGJvcmRlclJhZGl1czogXCJcIixcbiAgfTtcbiAgQElucHV0KCkgbGlzdEl0ZW1TdHlsZTogTGlzdEl0ZW1TdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiOTclXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBASW5wdXQoKSBzdGF0dXNJbmRpY2F0b3JTdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIxMHB4XCIsXG4gICAgd2lkdGg6IFwiMTBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCIxNnB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIHR5cGluZ0luZGljYXRvclRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiSVNfVFlQSU5HXCIpO1xuICBASW5wdXQoKSB0aHJlYWRJbmRpY2F0b3JUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIklOX0FfVEhSRUFEXCIpO1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgcmVjZWlwdFN0eWxlOiBSZWNlaXB0U3R5bGUgPSB7fTtcbiAgY2NHcm91cE1lbWJlckFkZGVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVySm9pbmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyS2lja2VkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyQmFubmVkITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuICBjY093bmVyc2hpcENoYW5nZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVNlbnQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NNZXNzYWdlRGVsZXRlITogU3Vic2NyaXB0aW9uO1xuICBjY0dyb3VwRGVsZXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NHcm91cExlZnQhOiBTdWJzY3JpcHRpb247XG4gIGNjVXNlckJsb2NrZWQhOiBTdWJzY3JpcHRpb247XG4gIGNjTWVzc2FnZVJlYWQhOiBTdWJzY3JpcHRpb247XG4gIG9uVGV4dE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZWRpYU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21NZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uRm9ybU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25TY2hlZHVsZXJNZXNzYWdlUmVjZWl2ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uQ2FyZE1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc1JlYWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZURlbGV0ZWQhOiBTdWJzY3JpcHRpb247XG4gIG9uTWVzc2FnZUVkaXRlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25NZXNzYWdlc0RlbGl2ZXJlZCE6IFN1YnNjcmlwdGlvbjtcbiAgb25UeXBpbmdTdGFydGVkITogU3Vic2NyaXB0aW9uO1xuICBvblR5cGluZ0VuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NPdXRnb2luZ0NhbGwhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyBjY0NhbGxSZWplY3RlZCE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIGNjQ2FsbEVuZGVkITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgY2NDYWxsQWNjZXB0ZWQhOiBTdWJzY3JpcHRpb247XG4gIGljb25TdHlsZTogYW55ID0ge1xuICAgIGljb25UaW50OiBcImxpZ2h0Z3JleVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgd2lkdGg6IFwiMjBweFwiLFxuICB9O1xuICBsaXN0U3R5bGU6IExpc3RTdHlsZSA9IG5ldyBMaXN0U3R5bGUoe30pO1xuICBtZW51c3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiXCIsXG4gICAgaGVpZ2h0OiBcIlwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB0ZXh0Rm9udDogXCJcIixcbiAgICB0ZXh0Q29sb3I6IFwiYmxhY2tcIixcbiAgICBpY29uVGludDogXCJncmV5XCIsXG4gICAgaWNvbkJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBpY29uQm9yZGVyOiBcIm5vbmVcIixcbiAgICBpY29uQm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBzdWJtZW51V2lkdGg6IFwiNzBweFwiLFxuICAgIHN1Ym1lbnVIZWlnaHQ6IFwiMjBweFwiLFxuICAgIHN1Ym1lbnVCb3JkZXI6IFwiMXB4IHNvbGlkICNlOGU4ZThcIixcbiAgICBzdWJtZW51Qm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIHN1Ym1lbnVCYWNrZ3JvdW5kOiBcIndoaXRlXCIsXG4gIH07XG4gIHB1YmxpYyB0eXBpbmdJbmRpY2F0b3IhOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yIHwgbnVsbDtcbiAgcHVibGljIHR5cGluZ0xpc3RlbmVySWQ6IHN0cmluZyA9XG4gICAgXCJjb252ZXJzYXRpb25fX0xJU1RFTkVSXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGNhbGxMaXN0ZW5lcklkID0gXCJjYWxsX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBjb25uZWN0aW9uTGlzdGVuZXJJZCA9IFwiY29ubmVjdGlvbl9cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICBzZWxlY3Rpb25tb2RlRW51bTogdHlwZW9mIFNlbGVjdGlvbk1vZGUgPSBTZWxlY3Rpb25Nb2RlO1xuICBwdWJsaWMgaXNEaWFsb2dPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0VtcHR5OiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBpc0xvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc3RhdHVzQ29sb3I6IGFueSA9IHtcbiAgICBvbmxpbmU6IFwiXCIsXG4gICAgcHJpdmF0ZTogXCJcIixcbiAgICBwYXNzd29yZDogXCIjRjdBNTAwXCIsXG4gICAgcHVibGljOiBcIlwiLFxuICB9O1xuICBwdWJsaWMgbGltaXQ6IG51bWJlciA9IDMwO1xuICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW107XG4gIHB1YmxpYyBzY3JvbGxlZFRvQm90dG9tOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBjaGVja0l0ZW1DaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29udmVyc2F0aW9uT3B0aW9ucyE6IENvbWV0Q2hhdE9wdGlvbltdO1xuICBwdWJsaWMgc2hvd0NvbmZpcm1EaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGNvbnZlcnNhdGlvblRvQmVEZWxldGVkOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9IG51bGw7XG4gIHB1YmxpYyB1c2VyTGlzdGVuZXJJZDogc3RyaW5nID0gXCJjaGF0bGlzdF91c2VyX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIHB1YmxpYyBncm91cExpc3RlbmVySWQ6IHN0cmluZyA9IFwiY2hhdGxpc3RfZ3JvdXBfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcHVibGljIGdyb3VwVG9VcGRhdGU6IENvbWV0Q2hhdC5Hcm91cCB8IHt9ID0ge307XG4gIHNhZmVIdG1sITogU2FmZUh0bWw7XG4gIGVuYWJsZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVN0aWNrZXJzOiBib29sZWFuID0gZmFsc2U7XG4gIGVuYWJsZVdoaXRlYm9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgZW5hYmxlRG9jdW1lbnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgdGhyZWFkSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvdGhyZWFkLWFycm93LnN2Z1wiO1xuICBwdWJsaWMgY29uZmlybURpYWxvZ1N0eWxlOiBDb25maXJtRGlhbG9nU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICB9O1xuICBzdWJ0aXRsZVZhbHVlITogc3RyaW5nO1xuICBtb2RhbFN0eWxlOiBCYXNlU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjIzMHB4XCIsXG4gICAgd2lkdGg6IFwiMjcwcHhcIixcbiAgfTtcbiAgZmlyc3RSZWxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNBY3RpdmU6IGJvb2xlYW4gPSB0cnVlO1xuICBjb250YWN0c05vdEZvdW5kOiBib29sZWFuID0gZmFsc2U7XG4gIGNoYXRTZWFyY2ghOiBib29sZWFuO1xuICByZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25zUmVxdWVzdDtcbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgZm9yIGludGVybmFsIHVzZVxuICAgKi9cbiAgcHVibGljIGxvY2FsaXplID0gbG9jYWxpemU7XG4gIC8qKlxuICAgKiBUaGlzIHByb3BlcnRpZXMgd2lsbCBjb21lIGZyb20gUGFyZW50LlxuICAgKi9cbiAgQElucHV0KCkgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIEBJbnB1dCgpIG1lbnRpb25zSWNvblVSTCE6IHN0cmluZztcbiAgQElucHV0KCkgZGlzYWJsZU1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj47XG5cbiAgLyoqXG4gICAqIFByb3BlcnRpZXMgZm9yIGludGVybmFsIHVzZVxuICAgKi9cbiAgLyoqXG4gICAqIHBhc3NpbmcgdGhpcyBjYWxsYmFjayB0byBtZW51TGlzdCBjb21wb25lbnQgb24gZGVsZXRlIGNsaWNrXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb259IGNvbnZlcnNhdGlvblxuICAgKi9cbiAgZGVsZXRlQ29udmVyc2F0aW9uT25DbGljazogKCgpID0+IHZvaWQpIHwgbnVsbCA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDb25maXJtYXRpb25EaWFsb2codGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCEpO1xuICB9O1xuICAvLyBjYWxsYmFjayBmb3IgY29uZmlybURpYWxvZ0NvbXBvbmVudFxuICBvbkNvbmZpcm1DbGljayA9ICgpID0+IHtcbiAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkQ29udmVyc2F0aW9uKCk7XG4gIH07XG4gIG9uQ29udmVyc2F0aW9uU2VsZWN0ZWQoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uLCBldmVudDogYW55KSB7XG4gICAgbGV0IHNlbGVjdGVkOiBib29sZWFuID0gZXZlbnQuZGV0YWlsLmNoZWNrZWQ7XG4gICAgaWYgKHRoaXMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub25TZWxlY3QoY29udmVyc2F0aW9uLCBzZWxlY3RlZCk7XG4gICAgfVxuICB9XG4gIHNldFN0YXR1c0luZGljYXRvclN0eWxlID0gKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgIGlmIChcbiAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXBcbiAgICApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogXCIxMnB4XCIsXG4gICAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0luZGljYXRvclN0eWxlO1xuICAgIH1cbiAgfTtcblxuICAvL1RvIGJlIGVuYWJsZWQgaW4gVU1DXG4gIC8vIGdldE1lbnRpb25JY29uU3R5bGUoKTogSWNvblN0eWxlIHtcbiAgLy8gICByZXR1cm4gbmV3IEljb25TdHlsZSh7XG4gIC8vICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAvLyAgICAgd2lkdGg6IFwiMTZweFwiLFxuICAvLyAgICAgaWNvblRpbnQ6XG4gIC8vICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZT8ubWVudGlvbkljb25UaW50ID8/XG4gIC8vICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufSBjb252ZXJzYXRpb25cbiAgICovXG4gIGNoZWNrU3RhdHVzVHlwZShjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICBsZXQgdXNlcjogQ29tZXRDaGF0LlVzZXIgPVxuICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcjtcbiAgICBpZiAoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICF0aGlzLmRpc2FibGVVc2Vyc1ByZXNlbmNlXG4gICAgKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHVzZXIuZ2V0U3RhdHVzKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW3VzZXIuZ2V0U3RhdHVzKCldO1xuICAgICAgfSBlbHNlIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBlbHNlIGlmIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG4gICAgICBsZXQgZ3JvdXAgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cDtcbiAgICAgIHJldHVybiB0aGlzLnN0YXR1c0NvbG9yW2dyb3VwLmdldFR5cGUoKV1cbiAgICB9XG4gIH1cblxuICBnZXRFeHRlbnNpb25EYXRhKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIGxldCBtZXNzYWdlVGV4dDtcbiAgICAvL3hzcyBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCB4c3NEYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwieHNzLWZpbHRlclwiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICB4c3NEYXRhICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eSh4c3NEYXRhLCBcInNhbml0aXplZF90ZXh0XCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eSh4c3NEYXRhLCBcImhhc1hTU1wiKSAmJlxuICAgICAgeHNzRGF0YS5oYXNYU1MgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0geHNzRGF0YS5zYW5pdGl6ZWRfdGV4dDtcbiAgICB9XG4gICAgLy9kYXRhbWFza2luZyBleHRlbnNpb25zIGRhdGFcbiAgICBjb25zdCBtYXNrZWREYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwiZGF0YS1tYXNraW5nXCJcbiAgICApO1xuICAgIGlmIChcbiAgICAgIG1hc2tlZERhdGEgJiZcbiAgICAgIENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5jaGVja0hhc093blByb3BlcnR5KG1hc2tlZERhdGEsIFwiZGF0YVwiKSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkoXG4gICAgICAgIG1hc2tlZERhdGEuZGF0YSxcbiAgICAgICAgXCJzZW5zaXRpdmVfZGF0YVwiXG4gICAgICApICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShcbiAgICAgICAgbWFza2VkRGF0YS5kYXRhLFxuICAgICAgICBcIm1lc3NhZ2VfbWFza2VkXCJcbiAgICAgICkgJiZcbiAgICAgIG1hc2tlZERhdGEuZGF0YS5zZW5zaXRpdmVfZGF0YSA9PT0gXCJ5ZXNcIlxuICAgICkge1xuICAgICAgbWVzc2FnZVRleHQgPSBtYXNrZWREYXRhLmRhdGEubWVzc2FnZV9tYXNrZWQ7XG4gICAgfVxuICAgIC8vcHJvZmFuaXR5IGV4dGVuc2lvbnMgZGF0YVxuICAgIGNvbnN0IHByb2ZhbmVEYXRhID0gQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrTWVzc2FnZUZvckV4dGVuc2lvbnNEYXRhKFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIFwicHJvZmFuaXR5LWZpbHRlclwiXG4gICAgKTtcbiAgICBpZiAoXG4gICAgICBwcm9mYW5lRGF0YSAmJlxuICAgICAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmNoZWNrSGFzT3duUHJvcGVydHkocHJvZmFuZURhdGEsIFwicHJvZmFuaXR5XCIpICYmXG4gICAgICBDb21ldENoYXRVSUtpdFV0aWxpdHkuY2hlY2tIYXNPd25Qcm9wZXJ0eShwcm9mYW5lRGF0YSwgXCJtZXNzYWdlX2NsZWFuXCIpICYmXG4gICAgICBwcm9mYW5lRGF0YS5wcm9mYW5pdHkgPT09IFwieWVzXCJcbiAgICApIHtcbiAgICAgIG1lc3NhZ2VUZXh0ID0gcHJvZmFuZURhdGEubWVzc2FnZV9jbGVhbjtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0IHx8IChtZXNzYWdlT2JqZWN0IGFzIGFueSkudGV4dDtcbiAgfVxuICBzZXRTdWJ0aXRsZSA9IChjb252ZXJzYXRpb25PYmplY3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+IHtcbiAgICBpZiAodGhpcy50eXBpbmdJbmRpY2F0b3IpIHtcbiAgICAgIGNvbnN0IGlzVHlwaW5nID1cbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iamVjdCBhcyBhbnkpPy5jb252ZXJzYXRpb25XaXRoPy5ndWlkID09XG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVySWQoKTtcbiAgICAgIGlmIChpc1R5cGluZykge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0TmFtZSgpfSAke3RoaXMudHlwaW5nSW5kaWNhdG9yVGV4dFxuICAgICAgICAgIH1gO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iamVjdCBhcyBhbnkpPy5jb252ZXJzYXRpb25XaXRoPy51aWQgPT1cbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3I/LmdldFNlbmRlcigpLmdldFVpZCgpICYmXG4gICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yLmdldFJlY2VpdmVyVHlwZSgpICE9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwaW5nSW5kaWNhdG9yVGV4dDtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IHN1YnRpdGxlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TGFzdENvbnZlcnNhdGlvbk1lc3NhZ2UoXG4gICAgICBjb252ZXJzYXRpb25PYmplY3QsXG4gICAgICB0aGlzLmxvZ2dlZEluVXNlciEsXG5cbiAgICAgIHtcbiAgICAgICAgZGlzYWJsZU1lbnRpb25zOiB0aGlzLmRpc2FibGVNZW50aW9ucyxcbiAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudC5jb252ZXJzYXRpb24sXG4gICAgICAgIHRleHRGb3JtYXR0ZXJzOiB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICB9XG4gICAgKTtcbiAgICBsZXQgaWNvbiA9XG4gICAgICBjb252ZXJzYXRpb25PYmplY3Q/LmdldExhc3RNZXNzYWdlKCk/LmdldFR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICAgICAgPyBcIvCfk54gXCJcbiAgICAgICAgOiBcIvCfk7kgXCI7XG5cbiAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZXIuYnlwYXNzU2VjdXJpdHlUcnVzdEh0bWwoXG4gICAgICBjb252ZXJzYXRpb25PYmplY3Q/LmdldExhc3RNZXNzYWdlKCk/LmdldENhdGVnb3J5KCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmNhbGxcbiAgICAgICAgPyBpY29uICsgc3VidGl0bGVcbiAgICAgICAgOiBzdWJ0aXRsZVxuICAgICk7XG4gIH07XG5cbiAgLy9UbyBiZSBlbmFibGVkIGluIFVNQ1xuICAvLyBnZXRVbnJlYWRNZW50aW9uc0ljb25TdHlsZSgpIHtcbiAgLy8gICByZXR1cm4ge1xuICAvLyAgICAgcGFkZGluZ1JpZ2h0OiBcIjNweFwiLFxuICAvLyAgIH07XG4gIC8vIH1cblxuICBjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pOiBzdHJpbmcge1xuICAgIGxldCBpbWFnZTogc3RyaW5nID0gXCJcIjtcbiAgICBpZiAoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwXG4gICAgKSB7XG4gICAgICBsZXQgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCA9IGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwO1xuICAgICAgc3dpdGNoIChncm91cC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnBhc3N3b3JkOlxuICAgICAgICAgIGltYWdlID0gdGhpcy5wYXNzd29yZEdyb3VwSWNvbiB8fCB0aGlzLnByb3RlY3RlZEdyb3VwSWNvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Hcm91cFR5cGVzLnByaXZhdGU6XG4gICAgICAgICAgaW1hZ2UgPSB0aGlzLnByaXZhdGVHcm91cEljb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaW1hZ2UgPSBcIlwiO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW1hZ2U7XG4gIH1cbiAgLy8gY2FsbGJhY2sgZm9yIGNvbmZpcm1EaWFsb2dDb21wb25lbnRcbiAgb25DYW5jZWxDbGljayA9ICgpID0+IHtcbiAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBudWxsO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgZ2V0TWVzc2FnZVJlY2VpcHQgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgbGV0IHJlY2VpcHQgPSBNZXNzYWdlUmVjZWlwdFV0aWxzLmdldFJlY2VpcHRTdGF0dXMoXG4gICAgICBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKVxuICAgICk7XG4gICAgcmV0dXJuIHJlY2VpcHQ7XG4gIH07XG4gIGdldERhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0ZVBhdHRlcm4gPz8gRGF0ZVBhdHRlcm5zLkRheURhdGVUaW1lO1xuICB9XG4gIG9wdGlvbnNTdHlsZSA9IHtcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlLFxuICAgIHByaXZhdGUgc2FuaXRpemVyOiBEb21TYW5pdGl6ZXJcbiAgKSB7IH1cblxuICBuZ09uSW5pdCgpIHtcbiAgICB0aGlzLmZpcnN0UmVsb2FkID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKSB7XG4gICAgICB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlciA9XG4gICAgICAgIG5ldyBDb21ldENoYXQuQ29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyKClcbiAgICAgICAgICAuc2V0TGltaXQodGhpcy5saW1pdCk7XG4gICAgfVxuICAgIHRoaXMuc2V0Q29udmVyc2F0aW9uT3B0aW9ucygpO1xuICAgIHRoaXMuc2V0VGhlbWVTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmF0dGFjaExpc3RlbmVycyh0aGlzLmNvbnZlcnNhdGlvblVwZGF0ZWQpO1xuICAgIHRoaXMucmVxdWVzdEJ1aWxkZXIgPSB0aGlzLmNvbnZlcnNhdGlvbnNSZXF1ZXN0QnVpbGRlci5idWlsZCgpO1xuICAgIHRoaXMuZ2V0Q29udmVyc2F0aW9uKCk7XG4gIH1cbiAgYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpIHtcbiAgICBDb21ldENoYXQuYWRkQ29ubmVjdGlvbkxpc3RlbmVyKFxuICAgICAgdGhpcy5jb25uZWN0aW9uTGlzdGVuZXJJZCxcbiAgICAgIG5ldyBDb21ldENoYXQuQ29ubmVjdGlvbkxpc3RlbmVyKHtcbiAgICAgICAgb25Db25uZWN0ZWQ6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PmNvbm5lY3RlZFwiKTtcbiAgICAgICAgICB0aGlzLmZldGNoTmV3Q29udmVyc2F0aW9ucygpO1xuICAgICAgICB9LFxuICAgICAgICBpbkNvbm5lY3Rpbmc6ICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb25MaXN0ZW5lciA9PiBJbiBjb25uZWN0aW5nXCIpO1xuICAgICAgICB9LFxuICAgICAgICBvbkRpc2Nvbm5lY3RlZDogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbkxpc3RlbmVyID0+IE9uIERpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuICB1cGRhdGVDb252ZXJzYXRpb25PYmplY3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvbklkKCkgPT0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEsIGNvbnZlcnNhdGlvbik7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyU2NvcGVDaGFuZ2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlclNjb3BlQ2hhbmdlZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmdyb3VwISk7XG4gICAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgICAgY29udmVyc2F0aW9uLnNldExhc3RNZXNzYWdlKGl0ZW0ubWVzc2FnZSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJBZGRlZCA9IENvbWV0Q2hhdEdyb3VwRXZlbnRzLmNjR3JvdXBNZW1iZXJBZGRlZC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTWVtYmVyQWRkZWQpID0+IHtcbiAgICAgICAgbGV0IGdyb3VwOiBDb21ldENoYXQuR3JvdXAgPSBpdGVtLnVzZXJBZGRlZEluITtcbiAgICAgICAgbGV0IGFjdGlvbk1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb25bXSA9IGl0ZW0ubWVzc2FnZXMhO1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoaXRlbS51c2VyQWRkZWRJbiEpO1xuICAgICAgICBjb252ZXJzYXRpb24/LnNldENvbnZlcnNhdGlvbldpdGgoZ3JvdXApO1xuICAgICAgICBjb252ZXJzYXRpb24/LnNldExhc3RNZXNzYWdlKGFjdGlvbk1lc3NhZ2VbYWN0aW9uTWVzc2FnZT8ubGVuZ3RoIC0gMV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbk9iamVjdChjb252ZXJzYXRpb24hKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyS2lja2VkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckJhbm5lZCA9XG4gICAgICBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTWVtYmVyQmFubmVkLnN1YnNjcmliZShcbiAgICAgICAgKGl0ZW06IElHcm91cE1lbWJlcktpY2tlZEJhbm5lZCkgPT4ge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb24gPSB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtLmtpY2tlZEZyb20hKTtcbiAgICAgICAgICBpZiAoY29udmVyc2F0aW9uKSB7XG4gICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0TGFzdE1lc3NhZ2UoaXRlbS5tZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uT2JqZWN0KGNvbnZlcnNhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICAgIHRoaXMuY2NHcm91cERlbGV0ZWQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwRGVsZXRlZC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogQ29tZXRDaGF0Lkdyb3VwKSA9PiB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID1cbiAgICAgICAgICB0aGlzLmdldENvbnZlcnNhdGlvbkZyb21Hcm91cChpdGVtKTtcbiAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NHcm91cExlZnQgPSBDb21ldENoYXRHcm91cEV2ZW50cy5jY0dyb3VwTGVmdC5zdWJzY3JpYmUoXG4gICAgICAoaXRlbTogSUdyb3VwTGVmdCkgPT4ge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSB0aGlzLmNvbnZlcnNhdGlvbkxpc3QuZmluZEluZGV4KFxuICAgICAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PVxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cCAmJlxuICAgICAgICAgICAgKGM/LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICAgICAgaXRlbS5sZWZ0R3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkID0gQ29tZXRDaGF0VXNlckV2ZW50cy5jY1VzZXJCbG9ja2VkLnN1YnNjcmliZShcbiAgICAgIChpdGVtOiBDb21ldENoYXQuVXNlcikgPT4ge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCA9XG4gICAgICAgICAgdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tVXNlcihpdGVtKTtcbiAgICAgICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gb2JqZWN0Lm1lc3NhZ2UhO1xuICAgICAgICBpZiAob2JqZWN0LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjTWVzc2FnZVNlbnQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQuc3Vic2NyaWJlKFxuICAgICAgKG9iajogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBvYmoubWVzc2FnZSE7XG4gICAgICAgIGlmIChvYmouc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuc3VjY2Vzcykge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VEZWxldGUgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlT2JqZWN0KTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY01lc3NhZ2VSZWFkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VSZWFkLnN1YnNjcmliZShcbiAgICAgIChtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgQ29tZXRDaGF0LkNvbWV0Q2hhdEhlbHBlci5nZXRDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShcbiAgICAgICAgICBtZXNzYWdlT2JqZWN0XG4gICAgICAgICkudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY29udmVyc2F0aW9uICYmXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICAgICAgY29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFZGl0ZWRNZXNzYWdlKG1lc3NhZ2VPYmplY3QgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgICAgICAgIHRoaXMucmVzZXRVbnJlYWRDb3VudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEVuZGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgaWYgKGNhbGwgJiYgT2JqZWN0LmtleXMoY2FsbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbFJlamVjdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxSZWplY3RlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjT3V0Z29pbmdDYWxsID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY091dGdvaW5nQ2FsbC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ2FsbEFjY2VwdGVkID0gQ29tZXRDaGF0Q2FsbEV2ZW50cy5jY0NhbGxBY2NlcHRlZC5zdWJzY3JpYmUoXG4gICAgICAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICB1bnN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NHcm91cE1lbWJlckFkZGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cE1lbWJlcktpY2tlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBNZW1iZXJCYW5uZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlU2VudD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjTWVzc2FnZURlbGV0ZT8udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNjR3JvdXBEZWxldGVkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NHcm91cExlZnQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1VzZXJCbG9ja2VkPy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NNZXNzYWdlUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tVXNlcih1c2VyOiBDb21ldENoYXQuVXNlcikge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudC5nZXRDb252ZXJzYXRpb25UeXBlKCkgPT1cbiAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT1cbiAgICAgICAgdXNlci5nZXRVaWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoXG4gICAgZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cFxuICApOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChlbGVtZW50OiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICBlbGVtZW50LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgIChlbGVtZW50LmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PVxuICAgICAgICBncm91cC5nZXRHdWlkKClcbiAgICApO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb252ZXJzYXRpb25MaXN0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjaGFuZ2VbXCJhY3RpdmVDb252ZXJzYXRpb25cIl0pIHtcbiAgICAgICAgdGhpcy5yZXNldFVucmVhZENvdW50KCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICogV2hlbiB1c2VyIHNlbmRzIG1lc3NhZ2UgY29udmVyc2F0aW9uTGlzdCBpcyB1cGRhdGVkIHdpdGggbGF0ZXN0IG1lc3NhZ2VcbiAgICAgICAqL1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLy8gZ2V0dGluZyBkZWZhdWx0IGNvbnZlcnNhdGlvbiBvcHRpb24gYW5kIGFkZGluZyBjYWxsYmFjayBpbiBpdFxuICBzZXRDb252ZXJzYXRpb25PcHRpb25zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5jb252ZXJzYXRpb25PcHRpb25zID0gQ29udmVyc2F0aW9uVXRpbHMuZ2V0RGVmYXVsdE9wdGlvbnMoKTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbk9wdGlvbnMuZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0T3B0aW9uKSA9PiB7XG4gICAgICBpZiAoXG4gICAgICAgICFlbGVtZW50Lm9uQ2xpY2sgJiZcbiAgICAgICAgZWxlbWVudC5pZCA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5Db252ZXJzYXRpb25PcHRpb25zLmRlbGV0ZVxuICAgICAgKSB7XG4gICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uT25DbGljaztcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gcmVzZXQgdW5yZWFkIGNvdW50XG4gIG9uQ2xpY2soY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSB7XG4gICAgaWYgKHRoaXMub25JdGVtQ2xpY2spIHtcbiAgICAgIHRoaXMub25JdGVtQ2xpY2soY29udmVyc2F0aW9uKTtcbiAgICB9XG4gIH1cbiAgLy8gc2V0IHVucmVhZCBjb3VudFxuICByZXNldFVucmVhZENvdW50KCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbikge1xuICAgICAgY29uc3QgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gW1xuICAgICAgICAuLi50aGlzLmNvbnZlcnNhdGlvbkxpc3QsXG4gICAgICBdO1xuICAgICAgLy9HZXRzIHRoZSBpbmRleCBvZiB1c2VyIHdoaWNoIGNvbWVzIG9mZmxpbmUvb25saW5lXG4gICAgICBjb25zdCBjb252ZXJzYXRpb25LZXkgPSBjb252ZXJzYXRpb25saXN0LmZpbmRJbmRleChcbiAgICAgICAgKGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmo/LmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICAgICk7XG4gICAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9XG4gICAgICAgICAgY29udmVyc2F0aW9ubGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAvL25ld0NvbnZlcnNhdGlvbk9iai5zZXRVbnJlYWRNZW50aW9uSW5NZXNzYWdlQ291bnQoMCk7XG4gICAgICAgIChuZXdDb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpPy5zZXRNdWlkKFxuICAgICAgICAgIHRoaXMuZ2V0VWlueCgpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIHNldHMgcHJvcGVydHkgZnJvbSB0aGVtZSB0byBzdHlsZSBvYmplY3RcbiAgc2V0VGhlbWVTdHlsZSgpIHtcbiAgICB0aGlzLnNldEF2YXRhclN0eWxlKCk7XG4gICAgdGhpcy5zZXRCYWRnZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRDb25maXJtRGlhbG9nU3R5bGUoKTtcbiAgICB0aGlzLnNldENvbnZlcnNhdGlvbnNTdHlsZSgpO1xuICAgIHRoaXMuc2V0TGlzdEl0ZW1TdHlsZSgpO1xuICAgIHRoaXMuc2V0RGF0ZVN0eWxlKCk7XG4gICAgdGhpcy5zZXRTdGF0dXNTdHlsZSgpO1xuICAgIHRoaXMuc2V0UmVjZWlwdFN0eWxlKCk7XG4gICAgdGhpcy5zdGF0dXNDb2xvci5wcml2YXRlID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLm9ubGluZSA9IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5vbmxpbmVTdGF0dXNDb2xvcjtcbiAgICB0aGlzLnN0YXR1c0NvbG9yLnBhc3N3b3JkID1cbiAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlPy5wYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ7XG4gICAgdGhpcy5saXN0U3R5bGUgPSB7XG4gICAgICB0aXRsZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50aXRsZVRleHRGb250LFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRpdGxlVGV4dENvbG9yLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dEZvbnQsXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lbXB0eVN0YXRlVGV4dENvbG9yLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dEZvbnQsXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5lcnJvclN0YXRlVGV4dENvbG9yLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sb2FkaW5nSWNvblRpbnQsXG4gICAgICBzZXBhcmF0b3JDb2xvcjogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuc2VwYXJhdG9yQ29sb3IsXG4gICAgfTtcbiAgICB0aGlzLmljb25TdHlsZS5pY29uVGludCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCk7XG4gIH1cbiAgc2V0TGlzdEl0ZW1TdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBMaXN0SXRlbVN0eWxlID0gbmV3IExpc3RJdGVtU3R5bGUoe1xuICAgICAgaGVpZ2h0OiBcIjk3JVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY3RpdmVCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBob3ZlckJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmxpc3RJdGVtU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5saXN0SXRlbVN0eWxlIH07XG4gIH1cbiAgc2V0QXZhdGFyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQXZhdGFyU3R5bGUgPSBuZXcgQXZhdGFyU3R5bGUoe1xuICAgICAgYm9yZGVyUmFkaXVzOiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjM2cHhcIixcbiAgICAgIGhlaWdodDogXCIzNnB4XCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBuYW1lVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgICAgYmFja2dyb3VuZFNpemU6IFwiY292ZXJcIixcbiAgICAgIG5hbWVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG5cbiAgICAgIG91dGVyVmlld0JvcmRlclNwYWNpbmc6IFwiXCIsXG4gICAgfSk7XG4gICAgdGhpcy5hdmF0YXJTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmF2YXRhclN0eWxlIH07XG4gIH1cbiAgc2V0U3RhdHVzU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFzZVN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEycHhcIixcbiAgICAgIHdpZHRoOiBcIjEycHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMjRweFwiLFxuICAgIH07XG4gICAgdGhpcy5zdGF0dXNJbmRpY2F0b3JTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuc3RhdHVzSW5kaWNhdG9yU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRDb252ZXJzYXRpb25zU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQ29udmVyc2F0aW9uc1N0eWxlID0gbmV3IENvbnZlcnNhdGlvbnNTdHlsZSh7XG4gICAgICBsYXN0TWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIGxhc3RNZXNzYWdlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YCxcbiAgICAgIHRpdGxlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb25saW5lU3RhdHVzQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U3VjY2VzcygpLFxuICAgICAgc2VwYXJhdG9yQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcml2YXRlR3JvdXBJY29uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRTdWNjZXNzKCksXG4gICAgICBwYXNzd29yZEdyb3VwSWNvbkJhY2tncm91bmQ6IFwiUkdCKDI0NywgMTY1LCAwKVwiLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgdHlwaW5nSW5kaWN0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICB0aHJlYWRJbmRpY2F0b3JUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMlxuICAgICAgKSxcbiAgICAgIHRocmVhZEluZGljYXRvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLmNvbnZlcnNhdGlvbnNTdHlsZSB9O1xuICB9XG4gIHNldERhdGVTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBEYXRlU3R5bGUgPSBuZXcgRGF0ZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGF0ZVN0eWxlID0geyAuLi5kZWZhdWx0U3R5bGUsIC4uLnRoaXMuZGF0ZVN0eWxlIH07XG4gIH1cbiAgc2V0UmVjZWlwdFN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IFJlY2VpcHRTdHlsZSA9IG5ldyBSZWNlaXB0U3R5bGUoe1xuICAgICAgd2FpdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgc2VudEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsaXZlcmVkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICByZWFkSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIHdpZHRoOiBcIjIwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLnJlY2VpcHRTdHlsZSA9IHsgLi4uZGVmYXVsdFN0eWxlLCAuLi50aGlzLnJlY2VpcHRTdHlsZSB9O1xuICB9XG4gIHNldEJhZGdlU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogQmFkZ2VTdHlsZSA9IG5ldyBCYWRnZVN0eWxlKHtcbiAgICAgIHRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBoZWlnaHQ6IFwiMTZweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICB9KTtcbiAgICB0aGlzLmJhZGdlU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5iYWRnZVN0eWxlIH07XG4gIH1cbiAgc2V0Q29uZmlybURpYWxvZ1N0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IENvbmZpcm1EaWFsb2dTdHlsZSA9IG5ldyBDb25maXJtRGlhbG9nU3R5bGUoe1xuICAgICAgY29uZmlybUJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNhbmNlbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0U2Vjb25kYXJ5KCksXG4gICAgICBjb25maXJtQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImxpZ2h0XCIpLFxuICAgICAgY29uZmlybUJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY2FuY2VsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMChcImRhcmtcIiksXG4gICAgICBjYW5jZWxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgbWVzc2FnZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIG1lc3NhZ2VUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIzNTBweFwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIH0pO1xuICAgIHRoaXMuZGVsZXRlQ29udmVyc2F0aW9uRGlhbG9nU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLmRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlLFxuICAgIH07XG4gIH1cbiAgLy8gY2hlY2tpbmcgaWYgdXNlciBoYXMgaGlzIG93biBjb25maWd1cmF0aW9uIGVsc2Ugd2lsbCB1c2UgZGVmYXVsdCBjb25maWd1cmF0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtPYmplY3Q9e319IGNvbmZpZ1xuICAgKiBAcGFyYW0gIHtPYmplY3R9IGRlZmF1bHRDb25maWc/XG4gICAqIEByZXR1cm5zIGRlZmF1bHRDb25maWdcbiAgICovXG4gIC8vIGNhbGxpbmcgc3VidGl0bGUgY2FsbGJhY2sgZnJvbSBjb25maWd1cmF0aW9uc1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbn0gY29udmVyc2F0aW9uXG4gICAqL1xuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgY292ZXJzYXRpb24gYmFzZWQgb24gdGhlIGNvbnZlcnNhdGlvblJlcXVlc3QgY29uZmlnXG4gICAqL1xuICBmZXRjaE5leHRDb252ZXJzYXRpb24oKTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMucmVxdWVzdEJ1aWxkZXIuZmV0Y2hOZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVkaXRlZE1lc3NhZ2UobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpICYmXG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuQmFzZU1lc3NhZ2UpLmdldElkKCkgPT1cbiAgICAgICAgbWVzc2FnZT8uZ2V0SWQoKVxuICAgICk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgIHRoaXMuY29udmVyc2F0aW9uRWRpdGVkRGVsZXRlZChtZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIGF0dGFjaGVzIExpc3RlbmVycyBmb3IgdXNlciBhY3Rpdml0eSAsIGdyb3VwIGFjdGl2aXRpZXMgYW5kIGNhbGxpbmdcbiAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBhdHRhY2hMaXN0ZW5lcnMoY2FsbGJhY2s6IGFueSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVVzZXJzUHJlc2VuY2UpIHtcbiAgICAgICAgQ29tZXRDaGF0LmFkZFVzZXJMaXN0ZW5lcihcbiAgICAgICAgICB0aGlzLnVzZXJMaXN0ZW5lcklkLFxuICAgICAgICAgIG5ldyBDb21ldENoYXQuVXNlckxpc3RlbmVyKHtcbiAgICAgICAgICAgIG9uVXNlck9ubGluZTogKG9ubGluZVVzZXI6IG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAvKiB3aGVuIHNvbWV1c2VyL2ZyaWVuZCBjb21lcyBvbmxpbmUsIHVzZXIgd2lsbCBiZSByZWNlaXZlZCBoZXJlICovXG4gICAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZSxcbiAgICAgICAgICAgICAgICBvbmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Vc2VyT2ZmbGluZTogKG9mZmxpbmVVc2VyOiBvYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgLyogd2hlbiBzb21ldXNlci9mcmllbmQgd2VudCBvZmZsaW5lLCB1c2VyIHdpbGwgYmUgcmVjZWl2ZWQgaGVyZSAqL1xuICAgICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lLFxuICAgICAgICAgICAgICAgIG9mZmxpbmVVc2VyXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuYWRkR3JvdXBMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5ncm91cExpc3RlbmVySWQsXG4gICAgICAgIG5ldyBDb21ldENoYXQuR3JvdXBMaXN0ZW5lcih7XG4gICAgICAgICAgb25Hcm91cE1lbWJlclNjb3BlQ2hhbmdlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgY2hhbmdlZFVzZXI6IGFueSxcbiAgICAgICAgICAgIG5ld1Njb3BlOiBhbnksXG4gICAgICAgICAgICBvbGRTY29wZTogYW55LFxuICAgICAgICAgICAgY2hhbmdlZEdyb3VwOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlcktpY2tlZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAga2lja2VkVXNlcjogYW55LFxuICAgICAgICAgICAga2lja2VkQnk6IGFueSxcbiAgICAgICAgICAgIGtpY2tlZEZyb206IGFueVxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKSA9PT0ga2lja2VkVXNlci5nZXRVaWQoKSkge1xuICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNvbnZlcnNhdGlvbkZyb21NZXNzYWdlKGtpY2tlZEZyb20pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uR3JvdXBNZW1iZXJCYW5uZWQ6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgIGJhbm5lZFVzZXI6IGFueSxcbiAgICAgICAgICAgIGJhbm5lZEJ5OiBhbnksXG4gICAgICAgICAgICBiYW5uZWRGcm9tOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT09IGJhbm5lZFVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZW1vdmVDb252ZXJzYXRpb25Gcm9tTWVzc2FnZShiYW5uZWRGcm9tKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25NZW1iZXJBZGRlZFRvR3JvdXA6IChcbiAgICAgICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgICAgIHVzZXJBZGRlZDogYW55LFxuICAgICAgICAgICAgdXNlckFkZGVkQnk6IGFueSxcbiAgICAgICAgICAgIHVzZXJBZGRlZEluOiBhbnlcbiAgICAgICAgICApID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckxlZnQ6IChtZXNzYWdlOiBhbnksIGxlYXZpbmdVc2VyOiBhbnksIGdyb3VwOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Hcm91cE1lbWJlckpvaW5lZDogKFxuICAgICAgICAgICAgbWVzc2FnZTogYW55LFxuICAgICAgICAgICAgam9pbmVkVXNlcjogYW55LFxuICAgICAgICAgICAgam9pbmVkR3JvdXA6IGFueVxuICAgICAgICAgICkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBDb21ldENoYXQuYWRkQ2FsbExpc3RlbmVyKFxuICAgICAgICB0aGlzLmNhbGxMaXN0ZW5lcklkLFxuICAgICAgICBuZXcgQ29tZXRDaGF0LkNhbGxMaXN0ZW5lcih7XG4gICAgICAgICAgb25JbmNvbWluZ0NhbGxSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uSW5jb21pbmdDYWxsQ2FuY2VsbGVkOiAoY2FsbDogQ29tZXRDaGF0LkNhbGwpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKGNhbGwpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25PdXRnb2luZ0NhbGxSZWplY3RlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uT3V0Z29pbmdDYWxsQWNjZXB0ZWQ6IChjYWxsOiBDb21ldENoYXQuQ2FsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24oY2FsbCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkNhbGxFbmRlZE1lc3NhZ2VSZWNlaXZlZDogKGNhbGw6IENvbWV0Q2hhdC5DYWxsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihjYWxsKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgLy8gU0RLIGxpc3RlbmVyc1xuICAgICAgdGhpcy5vblRleHRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uVGV4dE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIHRleHRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZWRpYU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lZGlhTWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLk1FRElBX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIG1lZGlhTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uQ3VzdG9tTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLkNVU1RPTV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBjdXN0b21NZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbkZvcm1NZXNzYWdlUmVjZWl2ZWQuc3Vic2NyaWJlKFxuICAgICAgICAgIChmb3JtTWVzc2FnZTogRm9ybU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVELFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICBmb3JtTWVzc2FnZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB0aGlzLm9uU2NoZWR1bGVyTWVzc2FnZVJlY2VpdmVkID1cbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGZvcm1NZXNzYWdlOiBTY2hlZHVsZXJNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhcbiAgICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuSU5URVJBQ1RJVkVfTUVTU0FHRV9SRUNFSVZFRCxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgZm9ybU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbkNhcmRNZXNzYWdlUmVjZWl2ZWQgPVxuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uQ2FyZE1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGNhcmRNZXNzYWdlOiBDYXJkTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGNhcmRNZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25DdXN0b21JbnRlcmFjdGl2ZU1lc3NhZ2VSZWNlaXZlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKGN1c3RvbU1lc3NhZ2U6IEN1c3RvbUludGVyYWN0aXZlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLm1lc3NhZ2VzLklOVEVSQUNUSVZFX01FU1NBR0VfUkVDRUlWRUQsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgIGN1c3RvbU1lc3NhZ2VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc1JlYWQuc3Vic2NyaWJlKFxuICAgICAgICAobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrQXNSZWFkKG1lc3NhZ2VSZWNlaXB0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm9uTWVzc2FnZURlbGV0ZWQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLm9uTWVzc2FnZURlbGV0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZGVsZXRlZE1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxFVEVELFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGRlbGV0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vbk1lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAoZWRpdGVkTWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRCxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBlZGl0ZWRNZXNzYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25NZXNzYWdlc0RlbGl2ZXJlZCA9XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25NZXNzYWdlc0RlbGl2ZXJlZC5zdWJzY3JpYmUoXG4gICAgICAgICAgKG1lc3NhZ2VSZWNlaXB0OiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdTdGFydGVkID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5vblR5cGluZ1N0YXJ0ZWQuc3Vic2NyaWJlKFxuICAgICAgICAodHlwaW5nSW5kaWNhdG9yOiBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmcpIHtcbiAgICAgICAgICAgIHRoaXMudHlwaW5nSW5kaWNhdG9yID0gdHlwaW5nSW5kaWNhdG9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMub25UeXBpbmdFbmRlZCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMub25UeXBpbmdFbmRlZC5zdWJzY3JpYmUoXG4gICAgICAgICh0eXBpbmdJbmRpY2F0b3I6IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IpID0+IHtcbiAgICAgICAgICB0aGlzLnR5cGluZ0luZGljYXRvciA9IG51bGw7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmZXRjaE5ld0NvbnZlcnNhdGlvbnMoKSB7XG4gICAgdGhpcy5yZXF1ZXN0QnVpbGRlciA9IHRoaXMuY29udmVyc2F0aW9uc1JlcXVlc3RCdWlsZGVyLmJ1aWxkKCk7XG4gICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gW107XG4gICAgdGhpcy5nZXRDb252ZXJzYXRpb24oU3RhdGVzLmxvYWRlZCk7XG4gIH1cbiAgcmVtb3ZlQ29udmVyc2F0aW9uRnJvbU1lc3NhZ2UoZ3JvdXA6IENvbWV0Q2hhdC5Hcm91cCkge1xuICAgIGxldCBjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gfCBudWxsID0gdGhpcy5nZXRDb252ZXJzYXRpb25Gcm9tR3JvdXAoZ3JvdXApXG4gICAgaWYgKGNvbnZlcnNhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25MaXN0KGNvbnZlcnNhdGlvbilcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgIHRyeSB7XG4gICAgICBDb21ldENoYXQucmVtb3ZlVXNlckxpc3RlbmVyKHRoaXMudXNlckxpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUdyb3VwTGlzdGVuZXIodGhpcy5ncm91cExpc3RlbmVySWQpO1xuICAgICAgQ29tZXRDaGF0LnJlbW92ZUNvbm5lY3Rpb25MaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25MaXN0ZW5lcklkKTtcbiAgICAgIHRoaXMub25UZXh0TWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lZGlhTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbU1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25Gb3JtTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblNjaGVkdWxlck1lc3NhZ2VSZWNlaXZlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25DYXJkTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbkN1c3RvbUludGVyYWN0aXZlTWVzc2FnZVJlY2VpdmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzUmVhZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRGVsZXRlZD8udW5zdWJzY3JpYmUoKTtcbiAgICAgIHRoaXMub25NZXNzYWdlRWRpdGVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vbk1lc3NhZ2VzRGVsaXZlcmVkPy51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy5vblR5cGluZ1N0YXJ0ZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgICB0aGlzLm9uVHlwaW5nRW5kZWQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBGZXRjaGVzIENvbnZlcnNhdGlvbnMgRGV0YWlscyB3aXRoIGFsbCB0aGUgdXNlcnNcbiAgICovXG4gIGdldENvbnZlcnNhdGlvbiA9IChzdGF0ZXM6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nKSA9PiB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5yZXF1ZXN0QnVpbGRlciAmJlxuICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uICYmXG4gICAgICAoKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLmN1cnJlbnRfcGFnZSA9PSAwIHx8XG4gICAgICAgICh0aGlzLnJlcXVlc3RCdWlsZGVyIGFzIGFueSkucGFnaW5hdGlvbi5jdXJyZW50X3BhZ2UgIT1cbiAgICAgICAgKHRoaXMucmVxdWVzdEJ1aWxkZXIgYXMgYW55KS5wYWdpbmF0aW9uLnRvdGFsX3BhZ2VzKVxuICAgICkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlcztcbiAgICAgICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgdGhpcy5mZXRjaE5leHRDb252ZXJzYXRpb24oKVxuICAgICAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uTGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdKSA9PiB7XG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC5mb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpXG4gICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpXG4gICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb24uc2V0VW5yZWFkTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb252ZXJzYXRpb24uc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KDApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlcyA9PSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IFtcbiAgICAgICAgICAgICAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgICAuLi5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0Lmxlbmd0aCA8PSAwICYmXG4gICAgICAgICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMuZW1wdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVtcHR5O1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRhY2goKTsgLy8gRGV0YWNoIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IFN0YXRlcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0YWNoKCk7IC8vIERldGFjaCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3RSZWxvYWQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuYXR0YWNoQ29ubmVjdGlvbkxpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5maXJzdFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbnZlcnNhdGlvbkxpc3Q/Lmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBpc1JlY2VpcHREaXNhYmxlKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBpdGVtOiBhbnkgPSBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpO1xuICAgIGxldCBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBjb252ZXJzYXRpb24uZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5kaXNhYmxlUmVjZWlwdCAmJlxuICAgICAgbWVzc2FnZSAmJlxuICAgICAgIW1lc3NhZ2U/LmdldERlbGV0ZWRBdCgpICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuYWN0aW9uICYmXG4gICAgICBtZXNzYWdlPy5nZXRDYXRlZ29yeSgpICE9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5jYWxsICYmXG4gICAgICAoIXRoaXMudHlwaW5nSW5kaWNhdG9yIHx8XG4gICAgICAgIChpdGVtPy51aWQgIT0gdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpICYmXG4gICAgICAgICAgaXRlbT8uZ3VpZCAhPSB0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlcklkKCkpKSAmJlxuICAgICAgbWVzc2FnZS5nZXRTZW5kZXIoKT8uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgY29udmVyc2F0aW9uIGxpc3QncyBsYXN0IG1lc3NhZ2UgLCBiYWRnZUNvdW50ICwgdXNlciBwcmVzZW5jZSBiYXNlZCBvbiBhY3Rpdml0aWVzIHByb3BhZ2F0ZWQgYnkgbGlzdGVuZXJzXG4gICAqL1xuICBjb252ZXJzYXRpb25VcGRhdGVkID0gKFxuICAgIGtleTogYW55LFxuICAgIGl0ZW06IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwIHwgbnVsbCA9IG51bGwsXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIG9wdGlvbnMgPSBudWxsXG4gICkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLnVzZXJTdGF0dXNUeXBlLm9ubGluZTpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy51c2VyU3RhdHVzVHlwZS5vZmZsaW5lOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVVc2VyKGl0ZW0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9SRUFEOiB7XG4gICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb24obWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVTU0FHRV9ERUxJVkVSRUQ6IHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlLCBmYWxzZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5URVhUX01FU1NBR0VfUkVDRUlWRUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMubWVzc2FnZXMuTUVESUFfTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5DVVNUT01fTUVTU0FHRV9SRUNFSVZFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5JTlRFUkFDVElWRV9NRVNTQUdFX1JFQ0VJVkVEOlxuICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlUmVjZWlwdCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrTWVzc2FnZUFzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5BRERFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5CQU5ORUQ6XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5MRUZUOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOlxuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlNDT1BFX0NIQU5HRTpcbiAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbihtZXNzYWdlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0VESVRFRDpcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5tZXNzYWdlcy5NRVNTQUdFX0RFTEVURUQ6XG4gICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25FZGl0ZWREZWxldGVkKG1lc3NhZ2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFya01lc3NhZ2VBc0RlbGl2ZXJlZCA9IChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAvL2lmIGNoYXQgd2luZG93IGlzIG5vdCBvcGVuLCBtYXJrIG1lc3NhZ2UgYXMgZGVsaXZlcmVkXG4gICAgaWYgKFxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvblR5cGUoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgKSB7XG4gICAgICBpZiAoXG4gICAgICAgICghdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gfHxcbiAgICAgICAgICAoXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyXG4gICAgICAgICAgKT8uZ2V0VWlkKCkgIT09IG1lc3NhZ2U/LmdldFNlbmRlcigpPy5nZXRVaWQoKSkgJiZcbiAgICAgICAgIW1lc3NhZ2UuaGFzT3duUHJvcGVydHkoXCJkZWxpdmVyZWRBdFwiKVxuICAgICAgKSB7XG4gICAgICAgIENvbWV0Q2hhdC5tYXJrQXNEZWxpdmVyZWQobWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgKCF0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiB8fFxuICAgICAgICAgIChcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uPy5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgKT8uZ2V0R3VpZCgpICE9PSBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCkpICYmXG4gICAgICAgICFtZXNzYWdlLmhhc093blByb3BlcnR5KFwiZGVsaXZlcmVkQXRcIilcbiAgICAgICkge1xuICAgICAgICBDb21ldENoYXQubWFya0FzRGVsaXZlcmVkKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gcmVhZE1lc3NhZ2VcbiAgICovXG4gIGdldFVpbnggPSAoKSA9PiB7XG4gICAgcmV0dXJuIFN0cmluZyhNYXRoLnJvdW5kKCtuZXcgRGF0ZSgpIC8gMTAwMCkpO1xuICB9O1xuICBtYXJrQXNSZWFkKHJlYWRNZXNzYWdlOiBDb21ldENoYXQuTWVzc2FnZVJlY2VpcHQpIHtcbiAgICBsZXQgY29udmVyc2F0aW9ubGlzdDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbltdID0gWy4uLnRoaXMuY29udmVyc2F0aW9uTGlzdF07XG4gICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAoY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4gICAgICAgICkuZ2V0UmVjZWl2ZXJJZCgpID09IHJlYWRNZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpXG4gICAgKTtcbiAgICBpZiAoY29udmVyc2F0aW9uS2V5ID4gLTEpIHtcbiAgICAgIGxldCBuZXdDb252ZXJzYXRpb25PYmplY3QhOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbXG4gICAgICAgICAgICBjb252ZXJzYXRpb25LZXlcbiAgICAgICAgICBdLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuZ2V0UmVhZEF0KClcbiAgICAgICkge1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QgPSBjb252ZXJzYXRpb25saXN0W2NvbnZlcnNhdGlvbktleV07XG4gICAgICAgIChcbiAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmplY3QuZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICAgKS5zZXRSZWFkQXQocmVhZE1lc3NhZ2UuZ2V0UmVhZEF0KCkpO1xuICAgICAgICAoXG4gICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqZWN0LmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbmxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgbmV3Q29udmVyc2F0aW9uT2JqZWN0KTtcbiAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbmxpc3RdO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBVcGRhdGVzIERldGFpbCB3aGVuIHVzZXIgY29tZXMgb25saW5lL29mZmxpbmVcbiAgICogQHBhcmFtXG4gICAqL1xuICAvKipcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LlVzZXJ8Q29tZXRDaGF0Lkdyb3VwfG51bGx9IHVzZXJcbiAgICovXG4gIHVwZGF0ZVVzZXIodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAgfCBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vd2hlbiB1c2VyIHVwZGF0ZXNcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbmxpc3Q6IENvbWV0Q2hhdC5Db252ZXJzYXRpb25bXSA9IFtcbiAgICAgICAgLi4udGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgXTtcbiAgICAgIC8vR2V0cyB0aGUgaW5kZXggb2YgdXNlciB3aGljaCBjb21lcyBvZmZsaW5lL29ubGluZVxuICAgICAgY29uc3QgY29udmVyc2F0aW9uS2V5ID0gY29udmVyc2F0aW9ubGlzdC5maW5kSW5kZXgoXG4gICAgICAgIChjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvblR5cGUoKSA9PT1cbiAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAoY29udmVyc2F0aW9uT2JqLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkgPT09XG4gICAgICAgICAgKHVzZXIgYXMgQ29tZXRDaGF0LlVzZXIpLmdldFVpZCgpXG4gICAgICApO1xuICAgICAgaWYgKGNvbnZlcnNhdGlvbktleSA+IC0xKSB7XG4gICAgICAgIGxldCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgIGNvbnZlcnNhdGlvbmxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgbGV0IGNvbnZlcnNhdGlvbldpdGhPYmo6IENvbWV0Q2hhdC5Vc2VyID1cbiAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Vc2VyO1xuICAgICAgICBjb252ZXJzYXRpb25XaXRoT2JqLnNldFN0YXR1cygodXNlciBhcyBDb21ldENoYXQuVXNlcikuZ2V0U3RhdHVzKCkpO1xuICAgICAgICBsZXQgbmV3Q29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID0gY29udmVyc2F0aW9uT2JqO1xuICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0Q29udmVyc2F0aW9uV2l0aChjb252ZXJzYXRpb25XaXRoT2JqKTtcbiAgICAgICAgKG5ld0NvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuc2V0TXVpZChcbiAgICAgICAgICB0aGlzLmdldFVpbngoKVxuICAgICAgICApO1xuICAgICAgICBjb252ZXJzYXRpb25saXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEsIG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbmxpc3Q7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgdGhlIGxhc3QgbWVzc2FnZVxuICAgKiBAcGFyYW0gY29udmVyc2F0aW9uXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtICB7Q29tZXRDaGF0LkNvbnZlcnNhdGlvbnx7fX0gY29udmVyc2F0aW9uXG4gICAqL1xuICBtYWtlTGFzdE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiB8IHt9ID0ge31cbiAgKSB7XG4gICAgY29uc3QgbmV3TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgcmV0dXJuIG5ld01lc3NhZ2U7XG4gIH1cbiAgdXBkYXRlQ29udmVyc2F0aW9uV2l0aEZvckdyb3VwKG1lc3NhZ2U6IENvbWV0Q2hhdC5BY3Rpb24sIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmIChtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwKSB7XG5cbiAgICAgIGNvbnN0IGlzU2FtZUdyb3VwID0gKG1lc3NhZ2UuZ2V0UmVjZWl2ZXIoKSBhcyBDb21ldENoYXQuR3JvdXApLmdldEd1aWQoKSA9PT1cbiAgICAgICAgKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRHdWlkKCk7XG5cbiAgICAgIGlmIChpc1NhbWVHcm91cCkge1xuICAgICAgICBsZXQgdXBkYXRlZEdyb3VwID0gY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXA7XG4gICAgICAgIHVwZGF0ZWRHcm91cC5zZXRNZW1iZXJzQ291bnQoKG1lc3NhZ2UuZ2V0QWN0aW9uRm9yKCkgYXMgQ29tZXRDaGF0Lkdyb3VwKS5nZXRNZW1iZXJzQ291bnQoKSk7XG4gICAgICAgIGNvbnZlcnNhdGlvbi5zZXRDb252ZXJzYXRpb25XaXRoKHVwZGF0ZWRHcm91cCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKlxuICAgKiBVcGRhdGVzIENvbnZlcnNhdGlvbnMgYXMgVGV4dC9DdXN0b20gTWVzc2FnZXMgYXJlIHJlY2VpdmVkXG4gICAqIEBwYXJhbVxuICAgKlxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKiBAcGFyYW0gIHtib29sZWFufSBub3RpZmljYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbihcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgbm90aWZpY2F0aW9uOiBib29sZWFuID0gdHJ1ZVxuICApIHtcbiAgICBsZXQgbWV0YWRhdGE6IGFueTtcbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5DdXN0b21NZXNzYWdlKSB7XG4gICAgICBtZXRhZGF0YSA9IG1lc3NhZ2UuZ2V0TWV0YWRhdGEoKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICAgICAgLy8gaWYgc2VuZGVyIGlzIG5vdCBsb2dnZWQgaW4gdXNlciB0aGVuICBpbmNyZW1lbnQgY291bnRcbiAgICAgICAgICAgIGxldCB1bnJlYWRNZXNzYWdlQ291bnQgPVxuICAgICAgICAgICAgICAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpICE9IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgfHxcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgPT0gbWVzc2FnZS5nZXRSZWNlaXZlcklkKCkpICYmXG4gICAgICAgICAgICAgICAgKCFtZXRhZGF0YSB8fFxuICAgICAgICAgICAgICAgICAgIW1ldGFkYXRhLmhhc093blByb3BlcnR5KFwiaW5jcmVtZW50VW5yZWFkQ291bnRcIikgfHxcbiAgICAgICAgICAgICAgICAgIG1ldGFkYXRhLmluY3JlbWVudFVucmVhZENvdW50ID09IHRydWUpXG4gICAgICAgICAgICAgICAgPyB0aGlzLm1ha2VVbnJlYWRNZXNzYWdlQ291bnQoY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgICAgIDogdGhpcy5tYWtlVW5yZWFkTWVzc2FnZUNvdW50KGNvbnZlcnNhdGlvbk9iaikgLSAxO1xuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShcbiAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IG5ld0NvbnZlcnNhdGlvbk9iajogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbiA9IGNvbnZlcnNhdGlvbk9iajtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgQ29tZXRDaGF0LkFjdGlvbikge1xuICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbldpdGhGb3JHcm91cChtZXNzYWdlLCBuZXdDb252ZXJzYXRpb25PYmopXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdDb252ZXJzYXRpb25PYmouc2V0TGFzdE1lc3NhZ2UobGFzdE1lc3NhZ2VPYmopO1xuICAgICAgICAgICAgbmV3Q29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudCh1bnJlYWRNZXNzYWdlQ291bnQpO1xuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGxhc3RNZXNzYWdlT2JqLmdldFNlbmRlcigpLmdldFVpZCgpICE9IHRoaXMubG9nZ2VkSW5Vc2VyPy5nZXRVaWQoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGxldCB0aW1lc0xvZ2dlZEluVXNlcklzTWVudGlvbmVkID0gMDtcbiAgICAgICAgICAgICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbGFzdE1lc3NhZ2VPYmouZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICAgICAgICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAoXG4gICAgICAgICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICAgICAgICBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobWVudGlvbmVkVXNlcnNbaV0uZ2V0VWlkKCkgPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWQrKztcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvL0NvbW1lbnRlZCBmb3Igbm93LiBUbyBiZSB1c2VkIGluIFVNQ1xuICAgICAgICAgICAgICAvLyBuZXdDb252ZXJzYXRpb25PYmouc2V0VW5yZWFkTWVudGlvbkluTWVzc2FnZUNvdW50KFxuICAgICAgICAgICAgICAvLyAgIGxhc3RNZXNzYWdlT2JqLmdldE1lbnRpb25lZFVzZXJzKClcbiAgICAgICAgICAgICAgLy8gICAgID8gbmV3Q29udmVyc2F0aW9uT2JqLmdldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgpICtcbiAgICAgICAgICAgICAgLy8gICAgIHRpbWVzTG9nZ2VkSW5Vc2VySXNNZW50aW9uZWRcbiAgICAgICAgICAgICAgLy8gICAgIDogMFxuICAgICAgICAgICAgICAvLyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnNwbGljZShjb252ZXJzYXRpb25LZXksIDEpO1xuICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdC51bnNoaWZ0KG5ld0NvbnZlcnNhdGlvbk9iaik7XG4gICAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpID09IG1lc3NhZ2UuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gPSBuZXdDb252ZXJzYXRpb25PYmo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgaW5jcmVtZW50Q291bnQgPSB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKSA/IDEgOiAwXG4gICAgICAgICAgICBsZXQgbGFzdE1lc3NhZ2VPYmogPSB0aGlzLm1ha2VMYXN0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5zZXRMYXN0TWVzc2FnZShsYXN0TWVzc2FnZU9iaik7XG4gICAgICAgICAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5BY3Rpb24pIHtcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb252ZXJzYXRpb25XaXRoRm9yR3JvdXAobWVzc2FnZSwgY29udmVyc2F0aW9uT2JqKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldFVucmVhZE1lc3NhZ2VDb3VudChpbmNyZW1lbnRDb3VudCk7XG4gICAgICAgICAgICBjb252ZXJzYXRpb25MaXN0LnVuc2hpZnQoY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdCA9IGNvbnZlcnNhdGlvbkxpc3Q7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiAmJlxuICAgICAgICAgICAgICB0aGlzLmxvZ2dlZEluVXNlcj8uZ2V0VWlkKCkgIT0gbWVzc2FnZT8uZ2V0U2VuZGVyKCk/LmdldFVpZCgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBTdGF0ZXMubG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU3RhdGVzLmxvYWRlZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIHVwZGF0ZURlbGl2ZXJlZE1lc3NhZ2UobWVzc2FnZVJlY2VpcHQ6IENvbWV0Q2hhdC5NZXNzYWdlUmVjZWlwdCkge1xuICAgIGxldCBjb252ZXJzYXRpb25MaXN0OiBDb21ldENoYXQuQ29udmVyc2F0aW9uW10gPSBbLi4udGhpcy5jb252ZXJzYXRpb25MaXN0XTtcbiAgICBsZXQgY29udmVyc2F0aW9uS2V5OiBudW1iZXIgPSBjb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgIChjOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PlxuICAgICAgICAoYy5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkuZ2V0SWQoKSA9PVxuICAgICAgICBOdW1iZXIobWVzc2FnZVJlY2VpcHQuZ2V0TWVzc2FnZUlkKCkpXG4gICAgKTtcbiAgICBsZXQgY29udmVyc2F0aW9uT2JqOiBDb21ldENoYXQuQ29udmVyc2F0aW9uO1xuICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgY29udmVyc2F0aW9uT2JqID0gY29udmVyc2F0aW9uTGlzdFtjb252ZXJzYXRpb25LZXldO1xuICAgICAgaWYgKFxuICAgICAgICAhKFxuICAgICAgICAgIGNvbnZlcnNhdGlvbk9iai5nZXRMYXN0TWVzc2FnZSgpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZVxuICAgICAgICApLmdldERlbGl2ZXJlZEF0KClcbiAgICAgICkge1xuICAgICAgICAoXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICkuc2V0RGVsaXZlcmVkQXQoTnVtYmVyKHRoaXMuZ2V0VWlueCgpKSk7XG4gICAgICAgIChjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpLnNldE11aWQoXG4gICAgICAgICAgdGhpcy5nZXRVaW54KClcbiAgICAgICAgKTtcbiAgICAgICAgY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoY29udmVyc2F0aW9uS2V5LCAxLCBjb252ZXJzYXRpb25PYmopO1xuICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3QgPSBbLi4uY29udmVyc2F0aW9uTGlzdF07XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEdldHMgVGhlIENvdW50IG9mIFVucmVhZCBNZXNzYWdlc1xuICAgKiBAcGFyYW1cbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGNvbnZlcnNhdGlvblxuICAgKiBAcGFyYW0gIHthbnl9IG9wZXJhdG9yXG4gICAqL1xuICBtYWtlVW5yZWFkTWVzc2FnZUNvdW50KFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBvcGVyYXRvcjogYW55ID0gbnVsbFxuICApIHtcbiAgICBpZiAoT2JqZWN0LmtleXMoY29udmVyc2F0aW9uKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBsZXQgdW5yZWFkTWVzc2FnZUNvdW50OiBudW1iZXIgPSBjb252ZXJzYXRpb24uZ2V0VW5yZWFkTWVzc2FnZUNvdW50KCk7XG4gICAgaWYgKFxuICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb24gJiZcbiAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbklkKCkgPT09XG4gICAgICBjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICkge1xuICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ICs9IDE7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKS5oYXNPd25Qcm9wZXJ0eShcImd1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCkgPT09XG4gICAgICAgIChjb252ZXJzYXRpb24uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGFzIENvbWV0Q2hhdC5Hcm91cCkuZ2V0R3VpZCgpKSB8fFxuICAgICAgKHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmhhc093blByb3BlcnR5KFwidWlkXCIpICYmXG4gICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkuaGFzT3duUHJvcGVydHkoXCJ1aWRcIikgJiZcbiAgICAgICAgKFxuICAgICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpID09PVxuICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlcikuZ2V0VWlkKCkpXG4gICAgKSB7XG4gICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAob3BlcmF0b3IgJiYgb3BlcmF0b3IgPT09IFwiZGVjcmVtZW50XCIpIHtcbiAgICAgICAgdW5yZWFkTWVzc2FnZUNvdW50ID0gdW5yZWFkTWVzc2FnZUNvdW50ID8gdW5yZWFkTWVzc2FnZUNvdW50IC0gMSA6IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bnJlYWRNZXNzYWdlQ291bnQgPSB1bnJlYWRNZXNzYWdlQ291bnQgKyAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5yZWFkTWVzc2FnZUNvdW50O1xuICB9XG4gIC8qKlxuICAgKiBDaGFuZ2VzIGRldGFpbCBvZiBjb252ZXJzYXRpb25zXG4gICAqIEBwYXJhbVxuICAgKi9cbiAgLyoqXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZVxuICAgKi9cbiAgbWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpIHtcbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IGNvbnZlcnNhdGlvbktleTogbnVtYmVyID0gdGhpcy5jb252ZXJzYXRpb25MaXN0LmZpbmRJbmRleChcbiAgICAgICAgKGM6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pID0+XG4gICAgICAgICAgYz8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PT0gbWVzc2FnZT8uZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKTtcbiAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPj0gMCkge1xuICAgICAgICBsZXQgY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uID1cbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbkxpc3RbY29udmVyc2F0aW9uS2V5XTtcbiAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgY29udmVyc2F0aW9uS2V5OiBjb252ZXJzYXRpb25LZXksXG4gICAgICAgICAgY29udmVyc2F0aW9uT2JqOiBjb252ZXJzYXRpb24sXG4gICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENvbWV0Q2hhdC5Db21ldENoYXRIZWxwZXIuZ2V0Q29udmVyc2F0aW9uRnJvbU1lc3NhZ2UobWVzc2FnZSlcbiAgICAgICAgICAudGhlbigoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbj8uZ2V0Q29udmVyc2F0aW9uV2l0aCgpIGluc3RhbmNlb2YgQ29tZXRDaGF0Lkdyb3VwICYmXG4gICAgICAgICAgICAgICEoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgICAgICAgKS5nZXRTY29wZSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25XaXRoKCkgYXMgQ29tZXRDaGF0Lkdyb3VwXG4gICAgICAgICAgICAgICkuc2V0SGFzSm9pbmVkKHRydWUpO1xuICAgICAgICAgICAgICAoY29udmVyc2F0aW9uLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXApLnNldFNjb3BlKFxuICAgICAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnRcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICBjb252ZXJzYXRpb25LZXk6IC0xLFxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmo6IGNvbnZlcnNhdGlvbixcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uTGlzdDogdGhpcy5jb252ZXJzYXRpb25MaXN0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuICAvKipcbiAgICogVXBkYXRlcyBDb252ZXJzYXRpb24gVmlldyB3aGVuIG1lc3NhZ2UgaXMgZWRpdGVkIG9yIGRlbGV0ZWRcbiAgICovXG4gIGNvbnZlcnNhdGlvbkVkaXRlZERlbGV0ZWQobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubWFrZUNvbnZlcnNhdGlvbihtZXNzYWdlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbktleSA9IHJlc3BvbnNlLmNvbnZlcnNhdGlvbktleTtcbiAgICAgICAgICBjb25zdCBjb252ZXJzYXRpb25PYmo6IENvbWV0Q2hhdC5Db252ZXJzYXRpb24gPVxuICAgICAgICAgICAgcmVzcG9uc2UuY29udmVyc2F0aW9uT2JqO1xuICAgICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbkxpc3QgPSByZXNwb25zZS5jb252ZXJzYXRpb25MaXN0O1xuICAgICAgICAgIGlmIChjb252ZXJzYXRpb25LZXkgPiAtMSkge1xuICAgICAgICAgICAgbGV0IGxhc3RNZXNzYWdlT2JqOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPVxuICAgICAgICAgICAgICBjb252ZXJzYXRpb25PYmouZ2V0TGFzdE1lc3NhZ2UoKTtcbiAgICAgICAgICAgIGlmIChsYXN0TWVzc2FnZU9iai5nZXRJZCgpID09PSBtZXNzYWdlLmdldElkKCkpIHtcbiAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLnNldExhc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgY29udmVyc2F0aW9uT2JqLmdldExhc3RNZXNzYWdlKCkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlXG4gICAgICAgICAgICAgICkuc2V0TXVpZCh0aGlzLmdldFVpbngoKSk7XG4gICAgICAgICAgICAgIGNvbnZlcnNhdGlvbkxpc3Quc3BsaWNlKGNvbnZlcnNhdGlvbktleSwgMSwgY29udmVyc2F0aW9uT2JqKTtcbiAgICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25MaXN0ID0gWy4uLmNvbnZlcnNhdGlvbkxpc3RdO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIElmIFVzZXIgc2Nyb2xscyB0byB0aGUgYm90dG9tIG9mIHRoZSBjdXJyZW50IENvbnZlcnNhdGlvbiBsaXN0IHRoYW4gZmV0Y2ggbmV4dCBpdGVtcyBvZiB0aGUgQ29udmVyc2F0aW9uIGxpc3QgYW5kIGFwcGVuZFxuICAgKiBAcGFyYW0gRXZlbnRcbiAgICovXG4gIC8qKlxuICAgKiBQbGF5cyBBdWRpbyBXaGVuIE1lc3NhZ2UgaXMgUmVjZWl2ZWRcbiAgICovXG4gIHBsYXlBdWRpbygpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIGlmICh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheSh0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLmluY29taW5nTWVzc2FnZUZyb21PdGhlclxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLypcbiAgICogVXBkYXRlcyB0aGUgY29udmVzYXRpb24gbGlzdCB3aGVuIGRlbGV0ZWQuXG4gICAqIEFkZGluZyBDb252ZXJzYXRpb24gT2JqZWN0IHRvIENvbWV0Y2hhdFNlcnZpY2VcbiAgICovXG4gIC8qKlxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uIHwgbnVsbCkge1xuICAgIGxldCBpbmRleCA9IHRoaXMuY29udmVyc2F0aW9uTGlzdC5maW5kSW5kZXgoXG4gICAgICAoZWxlbWVudDogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikgPT5cbiAgICAgICAgZWxlbWVudD8uZ2V0Q29udmVyc2F0aW9uSWQoKSA9PSBjb252ZXJzYXRpb24/LmdldENvbnZlcnNhdGlvbklkKClcbiAgICApO1xuICAgIHRoaXMuY29udmVyc2F0aW9uTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogc2hvd2luZyBkaWFsb2cgZm9yIGNvbmZpcm0gYW5kIGNhbmNlbFxuICAgKiBAcGFyYW0gIHtDb21ldENoYXQuQ29udmVyc2F0aW9ufHt9fSBjb252ZXJzYXRpb25cbiAgICovXG4gIHNob3dDb25maXJtYXRpb25EaWFsb2cgPSAoY29udmVyc2F0aW9uOiBDb21ldENoYXQuQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgdGhpcy5pc0RpYWxvZ09wZW4gPSB0cnVlO1xuICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQgPSBjb252ZXJzYXRpb247XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBvbk9wdGlvbkNsaWNrKGV2ZW50OiBhbnksIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGxldCBvcHRpb246IENvbWV0Q2hhdE9wdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmRhdGE7XG4gICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCA9IGNvbnZlcnNhdGlvbjtcbiAgICBpZiAob3B0aW9uKSB7XG4gICAgICBvcHRpb24ub25DbGljayEoKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIHNob3cgY29uZmlybSBkaWFsb2cgc2NyZWVuXG4gICAqIEBwYXJhbSAge0NvbWV0Q2hhdC5Db252ZXJzYXRpb258e319IGNvbnZlcnNhdG9uXG4gICAqL1xuICAvLyBjaGVjayBpcyB0aGVyZSBpcyBhbnkgYWN0aXZlIGNvbnZlcnNhdGlvbiBhbmQgbWFyayBpdCBhcyBhY3RpdmVcbiAgZ2V0QWN0aXZlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbikge1xuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGUgPT0gU2VsZWN0aW9uTW9kZS5ub25lIHx8ICF0aGlzLnNlbGVjdGlvbk1vZGUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uICYmXG4gICAgICAgICh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiBhcyBhbnkpPy5jb252ZXJzYXRpb25JZCA9PVxuICAgICAgICAoY29udmVyc2F0aW9uIGFzIGFueSk/LmNvbnZlcnNhdGlvbklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBoYW5kbGUgY29uZmlybSBkaWFsb2cgcmVzcG9uc2VcbiAgICogQHBhcmFtICB7c3RyaW5nfSB2YWx1ZVxuICAgKi9cbiAgLy8gY2FsbGluZyBjb21ldGNoYXQuZGVsZXRlQ29udmVyc2F0aW9uIG1ldGhvZFxuICBkZWxldGVTZWxlY3RlZENvbnZlcnNhdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCkge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbiAmJlxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbi5nZXRDb252ZXJzYXRpb25JZCgpID09XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uVG9CZURlbGV0ZWQuZ2V0Q29udmVyc2F0aW9uSWQoKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGxldCBjb252ZXJzYXRpb25XaXRoO1xuICAgICAgbGV0IGNvbnZlcnNhdGlvblR5cGUgPSB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvblR5cGUoKTtcbiAgICAgIGlmIChcbiAgICAgICAgY29udmVyc2F0aW9uVHlwZSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICApIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuVXNlclxuICAgICAgICApLmdldFVpZCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udmVyc2F0aW9uV2l0aCA9IChcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkLmdldENvbnZlcnNhdGlvbldpdGgoKSBhcyBDb21ldENoYXQuR3JvdXBcbiAgICAgICAgKS5nZXRHdWlkKCk7XG4gICAgICB9XG4gICAgICBDb21ldENoYXQuZGVsZXRlQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbldpdGgsIGNvbnZlcnNhdGlvblR5cGUpLnRoZW4oXG4gICAgICAgIChkZWxldGVkQ29udmVyc2F0aW9uKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0Q29udmVyc2F0aW9uRXZlbnRzLmNjQ29udmVyc2F0aW9uRGVsZXRlZC5uZXh0KFxuICAgICAgICAgICAgdGhpcy5jb252ZXJzYXRpb25Ub0JlRGVsZXRlZCFcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uTGlzdCh0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkKTtcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvblRvQmVEZWxldGVkID0gbnVsbDtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLmlzRGlhbG9nT3BlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICAvLyBleHBvc2VkIG1ldGhvZHMgdG8gdXNlcnMuXG4gIHVwZGF0ZUxhc3RNZXNzYWdlKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHRoaXMudXBkYXRlQ29udmVyc2F0aW9uKG1lc3NhZ2UpO1xuICB9XG4gIHJlbW92ZUNvbnZlcnNhdGlvbihjb252ZXJzYXRpb246IENvbWV0Q2hhdC5Db252ZXJzYXRpb24pIHtcbiAgICB0aGlzLnVwZGF0ZUNvbnZlcnNhdGlvbkxpc3QoY29udmVyc2F0aW9uKTtcbiAgfVxuICBzdHlsZXM6IGFueSA9IHtcbiAgICB3cmFwcGVyU3R5bGU6ICgpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGhlaWdodDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUuaGVpZ2h0LFxuICAgICAgICB3aWR0aDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUud2lkdGgsXG4gICAgICAgIGJvcmRlcjpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5ib3JkZXIgfHxcbiAgICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmJvcmRlclJhZGl1cyxcbiAgICAgICAgYmFja2dyb3VuZDpcbiAgICAgICAgICB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5iYWNrZ3JvdW5kIHx8XG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG4gIHN1YnRpdGxlU3R5bGUgPSAoY29udmVyc2F0aW9uOiBhbnkpID0+IHtcbiAgICBpZiAoXG4gICAgICB0aGlzLnR5cGluZ0luZGljYXRvciAmJlxuICAgICAgKCh0aGlzLnR5cGluZ0luZGljYXRvci5nZXRSZWNlaXZlclR5cGUoKSA9PVxuICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0U2VuZGVyKCkuZ2V0VWlkKCkgPT1cbiAgICAgICAgY29udmVyc2F0aW9uLmNvbnZlcnNhdGlvbldpdGg/LnVpZCkgfHxcbiAgICAgICAgdGhpcy50eXBpbmdJbmRpY2F0b3IuZ2V0UmVjZWl2ZXJJZCgpID09XG4gICAgICAgIGNvbnZlcnNhdGlvbi5jb252ZXJzYXRpb25XaXRoPy5ndWlkKVxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZm9udDogdGhpcy5jb252ZXJzYXRpb25zU3R5bGUudHlwaW5nSW5kaWN0b3JUZXh0Q29sb3IsXG4gICAgICAgIGNvbG9yOiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS50eXBpbmdJbmRpY3RvclRleHRDb2xvcixcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmb250OiB0aGlzLmNvbnZlcnNhdGlvbnNTdHlsZS5sYXN0TWVzc2FnZVRleHRGb250LFxuICAgICAgY29sb3I6IHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLmxhc3RNZXNzYWdlVGV4dENvbG9yLFxuICAgIH07XG4gIH07XG4gIGl0ZW1UaHJlYWRJbmRpY2F0b3JTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dEZvbnQ6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMiksXG4gICAgICB0ZXh0Q29sb3I6XG4gICAgICAgIHRoaXMuY29udmVyc2F0aW9uc1N0eWxlLnRocmVhZEluZGljYXRvclRleHRDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH07XG4gIH07XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc1wiIFtuZ1N0eWxlXT1cInN0eWxlcy53cmFwcGVyU3R5bGUoKVwiPlxuICA8Y29tZXRjaGF0LWJhY2tkcm9wIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIiAqbmdJZj1cImlzRGlhbG9nT3BlblwiPlxuICAgIDxjb21ldGNoYXQtY29uZmlybS1kaWFsb2cgW3RpdGxlXT1cImNvbmZpcm1EaWFsb2dUaXRsZVwiXG4gICAgICBbbWVzc2FnZVRleHRdPVwiY29uZmlybURpYWxvZ01lc3NhZ2VcIiBbY2FuY2VsQnV0dG9uVGV4dF09XCJjYW5jZWxCdXR0b25UZXh0XCJcbiAgICAgIFtjb25maXJtQnV0dG9uVGV4dF09XCJjb25maXJtQnV0dG9uVGV4dFwiXG4gICAgICAoY2MtY29uZmlybS1jbGlja2VkKT1cIm9uQ29uZmlybUNsaWNrKClcIlxuICAgICAgKGNjLWNhbmNlbC1jbGlja2VkKT1cIm9uQ2FuY2VsQ2xpY2soKVwiXG4gICAgICBbY29uZmlybURpYWxvZ1N0eWxlXT1cImRlbGV0ZUNvbnZlcnNhdGlvbkRpYWxvZ1N0eWxlXCI+XG4gICAgPC9jb21ldGNoYXQtY29uZmlybS1kaWFsb2c+XG4gIDwvY29tZXRjaGF0LWJhY2tkcm9wPlxuICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fbWVudXNcIiAqbmdJZj1cIm1lbnVcIj5cblxuICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJtZW51XCI+XG4gICAgPC9uZy1jb250YWluZXI+XG5cbiAgPC9kaXY+XG4gIDxjb21ldGNoYXQtbGlzdCBbc3RhdGVdPVwic3RhdGVcIiBbc2VhcmNoSWNvblVSTF09XCJzZWFyY2hJY29uVVJMXCJcbiAgICBbaGlkZUVycm9yXT1cImhpZGVFcnJvclwiIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgW2xvYWRpbmdJY29uVVJMXT1cImxvYWRpbmdJY29uVVJMXCIgW3RpdGxlQWxpZ25tZW50XT1cInRpdGxlQWxpZ25tZW50XCJcbiAgICBbbG9hZGluZ1ZpZXddPVwibG9hZGluZ1N0YXRlVmlld1wiIFtsaXN0U3R5bGVdPVwibGlzdFN0eWxlXCJcbiAgICBbZW1wdHlTdGF0ZVZpZXddPVwiZW1wdHlTdGF0ZVZpZXdcIiBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIlxuICAgIFtlcnJvclZpZXddPVwiZXJyb3JTdGF0ZVZpZXdcIiBbb25TY3JvbGxlZFRvQm90dG9tXT1cImdldENvbnZlcnNhdGlvblwiXG4gICAgW2xpc3RdPVwiY29udmVyc2F0aW9uTGlzdFwiXG4gICAgW2xpc3RJdGVtVmlld109XCJsaXN0SXRlbVZpZXcgPyBsaXN0SXRlbVZpZXcgOiBsaXN0SXRlbVwiIFt0aXRsZV09XCJ0aXRsZVwiXG4gICAgW2hpZGVTZWFyY2hdPVwiaGlkZVNlYXJjaFwiPjwvY29tZXRjaGF0LWxpc3Q+XG48L2Rpdj5cbjxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LWNvbnZlcnNhdGlvbj5cbiAgPGNvbWV0Y2hhdC1saXN0LWl0ZW0gW2hpZGVTZXBhcmF0b3JdPVwiaGlkZVNlcGFyYXRvclwiXG4gICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yU3R5bGVdPVwic2V0U3RhdHVzSW5kaWNhdG9yU3R5bGUoY29udmVyc2F0aW9uKVwiXG4gICAgW2lkXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uSWRcIlxuICAgIFtpc0FjdGl2ZV09XCJnZXRBY3RpdmVDb252ZXJzYXRpb24oY29udmVyc2F0aW9uKVwiXG4gICAgKGNjLWxpc3RpdGVtLWNsaWNrZWQpPVwib25DbGljayhjb252ZXJzYXRpb24pXCJcbiAgICBbdGl0bGVdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5uYW1lXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9ySWNvbl09XCJjaGVja0dyb3VwVHlwZShjb252ZXJzYXRpb24pXCJcbiAgICBbc3RhdHVzSW5kaWNhdG9yQ29sb3JdPVwiY2hlY2tTdGF0dXNUeXBlKGNvbnZlcnNhdGlvbilcIlxuICAgIFtsaXN0SXRlbVN0eWxlXT1cImxpc3RJdGVtU3R5bGVcIlxuICAgIFthdmF0YXJVUkxdPVwiY29udmVyc2F0aW9uPy5jb252ZXJzYXRpb25XaXRoPy5hdmF0YXJcIlxuICAgIFthdmF0YXJOYW1lXT1cImNvbnZlcnNhdGlvbj8uY29udmVyc2F0aW9uV2l0aD8ubmFtZVwiPlxuICAgIDxkaXYgc2xvdD1cInN1YnRpdGxlVmlld1wiICpuZ0lmPVwic3VidGl0bGVWaWV3O2Vsc2UgY29udmVyc2F0aW9uU3VidGl0bGVcIj5cbiAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgIDwvbmctY29udGFpbmVyPlxuICAgIDwvZGl2PlxuICAgIDxuZy10ZW1wbGF0ZSAjY29udmVyc2F0aW9uU3VidGl0bGU+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zdWJ0aXRsZS12aWV3IFwiIHNsb3Q9XCJzdWJ0aXRsZVZpZXdcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3RocmVhZHZpZXdcIlxuICAgICAgICAgICpuZ0lmPVwiY29udmVyc2F0aW9uPy5sYXN0TWVzc2FnZT8ucGFyZW50TWVzc2FnZUlkXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1sYWJlbCBbbGFiZWxTdHlsZV09XCJpdGVtVGhyZWFkSW5kaWNhdG9yU3R5bGUoKVwiXG4gICAgICAgICAgICBbdGV4dF09XCJ0aHJlYWRJbmRpY2F0b3JUZXh0XCI+IDwvY29tZXRjaGF0LWxhYmVsPlxuICAgICAgICAgIDxjb21ldGNoYXQtaWNvbiBbVVJMXT1cInRocmVhZEljb25VUkxcIlxuICAgICAgICAgICAgW2ljb25TdHlsZV09XCJpY29uU3R5bGVcIj48L2NvbWV0Y2hhdC1pY29uPlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fc3VidGl0bGVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fcmVhZHJlY2VpcHRcIlxuICAgICAgICAgICAgKm5nSWY9XCJpc1JlY2VpcHREaXNhYmxlKGNvbnZlcnNhdGlvbilcIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVjZWlwdCBbcmVjZWlwdF09XCJnZXRNZXNzYWdlUmVjZWlwdChjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICAgICAgW3JlY2VpcHRTdHlsZV09XCJyZWNlaXB0U3R5bGVcIiBbc2VudEljb25dPVwic2VudEljb25cIlxuICAgICAgICAgICAgICBbZXJyb3JJY29uXT1cImVycm9ySWNvblwiIFtkZWxpdmVyZWRJY29uXT1cImRlbGl2ZXJlZEljb25cIlxuICAgICAgICAgICAgICBbcmVhZEljb25dPVwicmVhZEljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPGRpdiBbbmdTdHlsZV09XCJzdWJ0aXRsZVN0eWxlKGNvbnZlcnNhdGlvbilcIiBjbGFzcz1cImNjLXN1YnRpdGxlX190ZXh0XCJcbiAgICAgICAgICAgIFtpbm5lckhUTUxdPVwic2V0U3VidGl0bGUoY29udmVyc2F0aW9uKVwiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgPC9kaXY+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgICA8ZGl2IHNsb3Q9XCJtZW51Vmlld1wiIGNsYXNzPVwiY2MtY29udmVyc2F0aW9uc19fb3B0aW9uc3ZpZXdcIlxuICAgICAgKm5nSWY9XCJzZWxlY3Rpb25Nb2RlID09IHNlbGVjdGlvbm1vZGVFbnVtLm5vbmVcIj5cbiAgICAgIDxkaXYgKm5nSWY9XCJvcHRpb25zXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cIm9wdGlvbnMoY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgKGNjLW1lbnUtY2xpY2tlZCk9XCJvbk9wdGlvbkNsaWNrKCRldmVudCxjb252ZXJzYXRpb24pXCJcbiAgICAgICAgICBbbWVudUxpc3RTdHlsZV09XCJtZW51c3R5bGVcIj5cblxuICAgICAgICA8L2NvbWV0Y2hhdC1tZW51LWxpc3Q+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgKm5nSWY9XCIhb3B0aW9ucyAmJiBjb252ZXJzYXRpb25PcHRpb25zXCI+XG4gICAgICAgIDxjb21ldGNoYXQtbWVudS1saXN0IFtkYXRhXT1cImNvbnZlcnNhdGlvbk9wdGlvbnNcIlxuICAgICAgICAgIChjYy1tZW51LWNsaWNrZWQpPVwib25PcHRpb25DbGljaygkZXZlbnQsY29udmVyc2F0aW9uKVwiXG4gICAgICAgICAgW21lbnVMaXN0U3R5bGVdPVwibWVudXN0eWxlXCI+XG5cbiAgICAgICAgPC9jb21ldGNoYXQtbWVudS1saXN0PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICAgPGRpdiBzbG90PVwidGFpbFZpZXdcIiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX3RhaWwtdmlld1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInRhaWxfX3ZpZXdcIiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0ubm9uZVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtZGF0ZVwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtZGF0ZSBbZGF0ZVN0eWxlXT1cImRhdGVTdHlsZVwiXG4gICAgICAgICAgICBbdGltZXN0YW1wXT1cImNvbnZlcnNhdGlvbj8ubGFzdE1lc3NhZ2U/LnNlbnRBdFwiXG4gICAgICAgICAgICBbcGF0dGVybl09XCJnZXREYXRlKClcIj48L2NvbWV0Y2hhdC1kYXRlPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLWNvbnZlcnNhdGlvbnNfX2JhZGdlXCI+XG4gICAgICAgICAgPCEtLSA8Y29tZXRjaGF0LWljb24gKm5nSWY9XCJjb252ZXJzYXRpb24/LmdldFVucmVhZE1lbnRpb25Jbk1lc3NhZ2VDb3VudCgpXCIgW25nU3R5bGVdPVwiZ2V0VW5yZWFkTWVudGlvbnNJY29uU3R5bGUoKVwiIFtpY29uU3R5bGVdPWdldE1lbnRpb25JY29uU3R5bGUoKSBbVVJMXT1cIm1lbnRpb25zSWNvblVSTFwiPjwvY29tZXRjaGF0LWljb24+IC0tPlxuICAgICAgICAgIDxjb21ldGNoYXQtYmFkZ2UgW2NvdW50XT1cImNvbnZlcnNhdGlvbj8udW5yZWFkTWVzc2FnZUNvdW50XCJcbiAgICAgICAgICAgIFtiYWRnZVN0eWxlXT1cImJhZGdlU3R5bGVcIj48L2NvbWV0Y2hhdC1iYWRnZT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1jb252ZXJzYXRpb25zX19zZWxlY3Rpb24tdmlld1wiXG4gICAgICAgICpuZ0lmPVwic2VsZWN0aW9uTW9kZSAhPSBzZWxlY3Rpb25tb2RlRW51bS5ub25lXCI+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nVGVtcGxhdGVPdXRsZXQ9XCJ0YWlsVmlld1wiPlxuICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2NvbWV0Y2hhdC1saXN0LWl0ZW0+XG4gIDxuZy10ZW1wbGF0ZSAjdGFpbFZpZXc+XG4gICAgPGRpdiAqbmdJZj1cInNlbGVjdGlvbk1vZGUgPT0gc2VsZWN0aW9ubW9kZUVudW0uc2luZ2xlXCI+XG4gICAgICA8Y29tZXRjaGF0LXJhZGlvLWJ1dHRvblxuICAgICAgICAoY2MtcmFkaW8tYnV0dG9uLWNoYW5nZWQpPVwib25Db252ZXJzYXRpb25TZWxlY3RlZChjb252ZXJzYXRpb24sJGV2ZW50KVwiPjwvY29tZXRjaGF0LXJhZGlvLWJ1dHRvbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2ICpuZ0lmPVwic2VsZWN0aW9uTW9kZSA9PSBzZWxlY3Rpb25tb2RlRW51bS5tdWx0aXBsZVwiPlxuICAgICAgPGNvbWV0Y2hhdC1jaGVja2JveFxuICAgICAgICAoY2MtY2hlY2tib3gtY2hhbmdlZCk9XCJvbkNvbnZlcnNhdGlvblNlbGVjdGVkKGNvbnZlcnNhdGlvbiwkZXZlbnQpXCI+PC9jb21ldGNoYXQtY2hlY2tib3g+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG48L25nLXRlbXBsYXRlPlxuIl19