import { CometChatMessageOption, MessageBubbleAlignment, CometChatMessageTemplate, CometChatMessageComposerAction, localize, CometChatUIKitConstants, fontHelper, MentionsTargetElement, } from "@cometchat/uikit-resources";
import { CometChatMentionsFormatter, CometChatUIKitLoginListener, CometChatUrlsFormatter, ConversationUtils, UserMentionStyle, } from "@cometchat/uikit-shared";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { ChatConfigurator } from "../Framework/ChatConfigurator";
export class MessageUtils {
    /**
   * Creates an option to edit message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getEditOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.editMessage,
            title: localize("EDIT"),
            iconURL: "assets/editicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Creates an option to react to a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getReactionOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.reactToMessage,
            title: localize("REACT"),
            iconURL: "assets/addreaction.svg",
            onClick: undefined,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Creates an option to get info about a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getMessageInfoOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.messageInformation,
            title: localize("INFO"),
            iconURL: "assets/Info.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
    * Creates an option to send a private message.
    * @param {CometChatTheme} theme - The theme object.
    * @return {CometChatMessageOption} - Returns a new message option.
    */
    getMessagePrivatelyOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.sendMessagePrivately,
            title: localize("MESSAGE_PRIVATELY"),
            iconURL: "assets/message-privately.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Creates an option to delete a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getDeleteOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.deleteMessage,
            title: localize("DELETE"),
            iconURL: "assets/deleteicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Creates an option to reply to a message in a thread.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getReplyInThreadOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.replyInThread,
            title: localize("REPLY"),
            iconURL: "assets/threadicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Creates an option to copy a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getCopyOption(theme) {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.copyMessage,
            title: localize("COPY"),
            iconURL: "assets/Copy.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600(),
        });
    }
    /**
   * Checks if a message is sent by current logged in user.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} message - The message to check.
   * @return {boolean} - Returns true if message is sent by current logged in user, otherwise false.
   */
    isSentByMe(loggedInUser, message) {
        return loggedInUser.getUid() === message.getSender().getUid();
    }
    /**
   * Fetches options for text messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getTextMessageOptions(loggedInUser, messageObject, theme, group) {
        let isSentByMe = this.isSentByMe(loggedInUser, messageObject);
        let isParticipant = false;
        if (group?.getScope() == CometChatUIKitConstants.groupMemberScope.participant) {
            isParticipant = true;
        }
        let messageOptionList = [];
        messageOptionList.push(this.getReactionOption(theme));
        if (!messageObject.getParentMessageId()) {
            messageOptionList.push(this.getReplyInThreadOption(theme));
        }
        messageOptionList.push(this.getCopyOption(theme));
        if (isSentByMe || (!isParticipant && group)) {
            messageOptionList.push(this.getEditOption(theme));
        }
        if (isSentByMe) {
            messageOptionList.push(this.getMessageInfoOption(theme));
        }
        if (isSentByMe || (!isParticipant && group))
            messageOptionList.push(this.getDeleteOption(theme));
        if (group && !isSentByMe) {
            messageOptionList.push(this.getMessagePrivatelyOption(theme));
        }
        return messageOptionList;
    }
    /**
   * Fetches options for image messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getImageMessageOptions(loggedInUser, messageObject, theme, group) {
        let messageOptionList = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    /**
   * Fetches options for video messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getVideoMessageOptions(loggedInUser, messageObject, theme, group) {
        let messageOptionList = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    /**
   * Fetches options for audio messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getAudioMessageOptions(loggedInUser, messageObject, theme, group) {
        let messageOptionList = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    /**
   * Fetches options for file messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getFileMessageOptions(loggedInUser, messageObject, theme, group) {
        let messageOptionList = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    getBottomView(_messageObject, _alignment) {
        return null;
    }
    getSchedulerMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.scheduler,
            category: CometChatUIKitConstants.MessageCategory.interactive,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getTextMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.text,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getAudioMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.audio,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getVideoMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.video,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getImageMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.image,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getGroupActionTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.groupMember,
            category: CometChatUIKitConstants.MessageCategory.action,
        });
    }
    getFileMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.file,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getFormMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.form,
            category: CometChatUIKitConstants.MessageCategory.interactive,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getCardMessageTemplate() {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.card,
            category: CometChatUIKitConstants.MessageCategory.interactive,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    /**
   * Function to check if a user's status should be visible
   * @param {CometChat.User | CometChat.GroupMember} user - The user whose status visibility is to be checked.
   * @return {boolean} - Returns `true` if the user's status should be hidden (blocked or offline), `false` otherwise.
   */
    getUserStatusVisibility(user) {
        let userBlockedFlag = false;
        if (user) {
            if (user.getBlockedByMe() || user.getHasBlockedMe() || user.getStatus() === CometChatUIKitConstants.userStatusType.offline) {
                userBlockedFlag = true;
            }
        }
        return userBlockedFlag;
    }
    getAllMessageTemplates() {
        return [
            ChatConfigurator.getDataSource().getTextMessageTemplate(),
            ChatConfigurator.getDataSource().getImageMessageTemplate(),
            ChatConfigurator.getDataSource().getVideoMessageTemplate(),
            ChatConfigurator.getDataSource().getAudioMessageTemplate(),
            ChatConfigurator.getDataSource().getFileMessageTemplate(),
            ChatConfigurator.getDataSource().getGroupActionTemplate(),
            ChatConfigurator.getDataSource().getFormMessageTemplate(),
            ChatConfigurator.getDataSource().getCardMessageTemplate(),
            ChatConfigurator.getDataSource().getSchedulerMessageTemplate(),
        ];
    }
    getMessageTemplate(messageType, messageCategory) {
        let _template = null;
        if (messageCategory != CometChatUIKitConstants.MessageCategory.call) {
            switch (messageType) {
                case CometChatUIKitConstants.MessageTypes.text:
                    _template = ChatConfigurator.getDataSource().getTextMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    _template =
                        ChatConfigurator.getDataSource().getImageMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    _template =
                        ChatConfigurator.getDataSource().getVideoMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.groupMember:
                    _template = ChatConfigurator.getDataSource().getGroupActionTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    _template = ChatConfigurator.getDataSource().getFileMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.audio:
                    _template =
                        ChatConfigurator.getDataSource().getAudioMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.form:
                    _template = ChatConfigurator.getDataSource().getFormMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.card:
                    _template = ChatConfigurator.getDataSource().getCardMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.scheduler:
                    _template =
                        ChatConfigurator.getDataSource().getSchedulerMessageTemplate();
                    break;
            }
        }
        return _template;
    }
    getMessageOptions(loggedInUser, messageObject, theme, group) {
        let _optionList = [];
        if (messageObject.getCategory() ==
            CometChatUIKitConstants.MessageCategory.message) {
            switch (messageObject.getType()) {
                case CometChatUIKitConstants.MessageTypes.text:
                    _optionList = ChatConfigurator.getDataSource().getTextMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    _optionList = ChatConfigurator.getDataSource().getImageMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    _optionList = ChatConfigurator.getDataSource().getVideoMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.groupMember:
                    _optionList = [];
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    _optionList = ChatConfigurator.getDataSource().getFileMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.audio:
                    _optionList = ChatConfigurator.getDataSource().getAudioMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
            }
        }
        else if (messageObject.getCategory() ==
            CometChatUIKitConstants.MessageCategory.custom ||
            messageObject.getCategory() ==
                CometChatUIKitConstants.MessageCategory.interactive) {
            _optionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        }
        return _optionList;
    }
    getCommonOptions(loggedInUser, messageObject, theme, group) {
        let isSentByMe = this.isSentByMe(loggedInUser, messageObject);
        let isParticipant = false;
        if (group?.getScope() == CometChatUIKitConstants.groupMemberScope.participant)
            isParticipant = true;
        let messageOptionList = [];
        messageOptionList.push(this.getReactionOption(theme));
        if (!messageObject?.getParentMessageId()) {
            messageOptionList.push(this.getReplyInThreadOption(theme));
        }
        if (isSentByMe) {
            messageOptionList.push(this.getMessageInfoOption(theme));
        }
        if (isSentByMe || (!isParticipant && group))
            messageOptionList.push(this.getDeleteOption(theme));
        if (group && !isSentByMe) {
            messageOptionList.push(this.getMessagePrivatelyOption(theme));
        }
        return messageOptionList;
    }
    getAllMessageTypes() {
        return [
            CometChatUIKitConstants.MessageTypes.text,
            CometChatUIKitConstants.MessageTypes.image,
            CometChatUIKitConstants.MessageTypes.audio,
            CometChatUIKitConstants.MessageTypes.video,
            CometChatUIKitConstants.MessageTypes.file,
            CometChatUIKitConstants.MessageTypes.groupMember,
            CometChatUIKitConstants.MessageTypes.form,
            CometChatUIKitConstants.MessageTypes.card,
            CometChatUIKitConstants.MessageTypes.scheduler,
        ];
    }
    addList() {
        return "<Message Utils>";
    }
    getAllMessageCategories() {
        return [
            CometChatUIKitConstants.MessageCategory.message,
            CometChatUIKitConstants.MessageCategory.action,
            CometChatUIKitConstants.MessageCategory.interactive,
        ];
    }
    getAuxiliaryOptions(id, user, group) {
        return null;
    }
    getId() {
        return "messageUtils";
    }
    getActionMessage(message) {
        try {
            if (message instanceof CometChat.Action) {
                const action = message.getAction();
                const actionBy = message.getActionBy();
                const actionOn = message.getActionOn();
                const byString = actionBy.getName();
                const forString = action === CometChatUIKitConstants.groupMemberAction.JOINED ||
                    action === CometChatUIKitConstants.groupMemberAction.LEFT
                    ? ""
                    : actionOn.getName();
                switch (action) {
                    case CometChatUIKitConstants.groupMemberAction.ADDED:
                        return `${byString} ${localize("ADDED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.JOINED:
                        return `${byString} ${localize("JOINED")}`;
                    case CometChatUIKitConstants.groupMemberAction.LEFT:
                        return `${byString} ${localize("LEFT")}`;
                    case CometChatUIKitConstants.groupMemberAction.KICKED:
                        return `${byString} ${localize("KICKED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.BANNED:
                        return `${byString} ${localize("BANNED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.UNBANNED:
                        return `${byString} ${localize("UNBANNED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
                        return `${byString} ${localize("MADE")} ${forString} ${message.getNewScope()}`;
                    default:
                        return "";
                }
            }
            else {
                return "";
            }
        }
        catch (e) {
            return "";
        }
    }
    imageAttachmentOption(theme) {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.image,
            title: localize("ATTACH_IMAGE"),
            iconURL: "assets/photolibrary.svg",
            onClick: null,
            iconTint: theme.palette.getAccent700(),
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent700(),
            borderRadius: "8px",
            background: theme.palette.getAccent100(),
        });
    }
    videoAttachmentOption(theme) {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.video,
            title: localize("ATTACH_VIDEO"),
            iconURL: "assets/video.svg",
            onClick: null,
            iconTint: theme.palette.getAccent700(),
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent700(),
            borderRadius: "8px",
            background: theme.palette.getAccent100(),
        });
    }
    audioAttachmentOption(theme) {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.audio,
            title: localize("ATTACH_AUDIO"),
            iconURL: "assets/audio-file.svg",
            onClick: null,
            iconTint: theme.palette.getAccent700(),
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent700(),
            borderRadius: "8px",
            background: theme.palette.getAccent100(),
        });
    }
    fileAttachmentOption(theme) {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.file,
            title: localize("ATTACH_FILE"),
            iconURL: "assets/attachment-file.svg",
            onClick: null,
            iconTint: theme.palette.getAccent700(),
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent700(),
            borderRadius: "8px",
            background: theme.palette.getAccent100(),
        });
    }
    getAttachmentOptions(theme, user, group, id) {
        let actions = [
            this.imageAttachmentOption(theme),
            this.videoAttachmentOption(theme),
            this.audioAttachmentOption(theme),
            this.fileAttachmentOption(theme),
        ];
        return actions;
    }
    getLastConversationMessage(conversation, loggedInUser, additionalConfigurations) {
        let config = {
            ...additionalConfigurations,
            textFormatters: additionalConfigurations?.textFormatters &&
                additionalConfigurations?.textFormatters.length
                ? [...additionalConfigurations.textFormatters]
                : [this.getMentionsTextFormatter({ theme: additionalConfigurations.theme, disableMentions: additionalConfigurations.disableMentions })],
        };
        let message = ConversationUtils.getLastConversationMessage(conversation, loggedInUser, config);
        let messageObject = conversation?.getLastMessage();
        if (messageObject) {
            let textFormatters = config.textFormatters;
            if (config && !config.disableMentions) {
                let mentionsTextFormatter;
                for (let i = 0; i < textFormatters.length; i++) {
                    if (textFormatters[i] instanceof CometChatMentionsFormatter) {
                        mentionsTextFormatter = textFormatters[i];
                        mentionsTextFormatter.setMessage(messageObject);
                        if (messageObject.getMentionedUsers().length) {
                            mentionsTextFormatter.setCometChatUserGroupMembers(messageObject.getMentionedUsers());
                        }
                        mentionsTextFormatter.setLoggedInUser(CometChatUIKitLoginListener.getLoggedInUser());
                    }
                    if (mentionsTextFormatter) {
                        break;
                    }
                }
                if (!mentionsTextFormatter) {
                    mentionsTextFormatter =
                        ChatConfigurator.getDataSource().getMentionsTextFormatter({
                            messageObject,
                            ...config,
                            alignment: null,
                            theme: additionalConfigurations.theme,
                        });
                    textFormatters.push(mentionsTextFormatter);
                }
            }
            if (messageObject &&
                messageObject instanceof CometChat.TextMessage) {
                for (let i = 0; i < textFormatters.length; i++) {
                    message = textFormatters[i].getFormattedText(message, { mentionsTargetElement: MentionsTargetElement.conversation });
                }
            }
        }
        return message;
    }
    /**
     * Adds styled @ for every mention in the text by matching uid
     *
     * @param {CometChat.TextMessage} message
     * @param {string} subtitle
     * @returns {void}
     */
    getMentionsFormattedText(message, subtitle, mentionsFormatterParams) {
        const regex = /<@uid:(.*?)>/g;
        let messageText = message.getText();
        let messageTextTmp = subtitle;
        let match = regex.exec(messageText);
        let cometChatUsers = [];
        let mentionedUsers = message.getMentionedUsers();
        while (match !== null) {
            let user;
            for (let i = 0; i < mentionedUsers.length; i++) {
                if (match[1] == mentionedUsers[i].getUid()) {
                    user = mentionedUsers[i];
                }
            }
            if (user) {
                cometChatUsers.push(user);
            }
            match = regex.exec(messageText);
        }
        let mentionsFormatter = this.getMentionsTextFormatter(mentionsFormatterParams);
        mentionsFormatter.setClasses(["cc-mentions"]);
        mentionsFormatter.setCometChatUserGroupMembers(cometChatUsers);
        messageTextTmp = mentionsFormatter.getFormattedText(messageTextTmp, mentionsFormatterParams);
        return messageTextTmp;
    }
    getAIOptions(theme, id) {
        return [];
    }
    getAllTextFormatters(formatterParams) {
        let formatters = [];
        const mentionsFormatter = formatterParams.disableMentions ? null : ChatConfigurator.getDataSource().getMentionsTextFormatter(formatterParams);
        const urlTextFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter(formatterParams);
        if (mentionsFormatter) {
            formatters.push(mentionsFormatter);
        }
        if (urlTextFormatter) {
            formatters.push(urlTextFormatter);
        }
        return formatters;
    }
    getMentionsTextFormatter(params) {
        let mentionsTextFormatter = new CometChatMentionsFormatter();
        if (params && params.theme) {
            mentionsTextFormatter.setComposerMentionStyle(new UserMentionStyle({
                loggedInUserTextFont: fontHelper(params.theme.typography.text2),
                loggedInUserTextColor: params.theme.palette.getPrimary(),
                loggedInUserTextBackground: "",
                mentionTextFont: fontHelper(params.theme.typography.text2),
                mentionTextColor: params.theme.palette.getPrimary(),
                mentionTextBackground: "",
            }));
            mentionsTextFormatter.setConversationMentionStyle(new UserMentionStyle({
                loggedInUserTextFont: fontHelper(params.theme.typography.text3),
                loggedInUserTextColor: params.theme.palette.getPrimary(),
                loggedInUserTextBackground: "",
                mentionTextFont: fontHelper(params.theme.typography.text3),
                mentionTextColor: params.theme.palette.getPrimary(),
                mentionTextBackground: "",
            }));
            mentionsTextFormatter.setRightBubbleMentionStyle(new UserMentionStyle({
                loggedInUserTextFont: fontHelper(params.theme.typography.text3),
                loggedInUserTextColor: params.theme.palette.getTertiary(),
                loggedInUserTextBackground: "",
                mentionTextFont: fontHelper(params.theme.typography.text3),
                mentionTextColor: params.theme.palette.getTertiary(),
                mentionTextBackground: "",
            }));
            mentionsTextFormatter.setLeftBubbleMentionStyle(new UserMentionStyle({
                loggedInUserTextFont: fontHelper(params.theme.typography.text3),
                loggedInUserTextColor: params.theme.palette.getPrimary(),
                loggedInUserTextBackground: "",
                mentionTextFont: fontHelper(params.theme.typography.text3),
                mentionTextColor: params.theme.palette.getPrimary(),
                mentionTextBackground: "",
            }));
        }
        return mentionsTextFormatter;
    }
    getUrlTextFormatter(params = {}) {
        let urlTextFormatter = new CometChatUrlsFormatter([
            /(https?:\/\/[^\s]+)/g,
        ]);
        if (params.alignment == MessageBubbleAlignment.left) {
            urlTextFormatter.setStyle({
                formattedTextColor: params.theme.palette.getPrimary(),
                formattedTextFont: fontHelper(params.theme.typography.text3),
            });
        }
        else {
            urlTextFormatter.setStyle({
                formattedTextColor: params.theme.palette.getTertiary(),
                formattedTextFont: fontHelper(params.theme.typography.text3),
            });
        }
        return urlTextFormatter;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzc2FnZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxzQkFBc0IsRUFDdEIsc0JBQXNCLEVBQ3RCLHdCQUF3QixFQUN4Qiw4QkFBOEIsRUFFOUIsUUFBUSxFQUNSLHVCQUF1QixFQUN2QixVQUFVLEVBRVYscUJBQXFCLEdBQ3RCLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLDBCQUEwQixFQUUxQiwyQkFBMkIsRUFDM0Isc0JBQXNCLEVBQ3RCLGlCQUFpQixFQUNqQixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFakUsTUFBTSxPQUFPLFlBQVk7SUFDdkI7Ozs7S0FJQztJQUVELGFBQWEsQ0FBQyxLQUFxQjtRQUNqQyxPQUFPLElBQUksc0JBQXNCLENBQUM7WUFDaEMsRUFBRSxFQUFFLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxXQUFXO1lBQ3JELEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDdEMsZUFBZSxFQUFFLGFBQWE7WUFDOUIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNqRCxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7U0FDekMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNEOzs7O0tBSUM7SUFF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SUFFRCxtQkFBbUIsQ0FBQyxTQUFjLEVBQUU7UUFDbEMsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLHNCQUFzQixDQUFDO1lBQ2hELHNCQUFzQjtTQUN2QixDQUFDLENBQUM7UUFDSCxJQUFJLE1BQU0sQ0FBQyxTQUFTLElBQUksc0JBQXNCLENBQUMsSUFBSSxFQUFFO1lBQ25ELGdCQUFnQixDQUFDLFFBQVEsQ0FBQztnQkFDeEIsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUNyRCxpQkFBaUIsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2FBQzdELENBQUMsQ0FBQztTQUNKO2FBQU07WUFDTCxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7Z0JBQ3hCLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtnQkFDdEQsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQzthQUM3RCxDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sZ0JBQWdCLENBQUM7SUFDMUIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbixcbiAgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCxcbiAgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlLFxuICBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24sXG4gIENvbWV0Q2hhdFRoZW1lLFxuICBsb2NhbGl6ZSxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIGZvbnRIZWxwZXIsXG4gIENvbWV0Q2hhdEFjdGlvbnNWaWV3LFxuICBNZW50aW9uc1RhcmdldEVsZW1lbnQsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0TG9naW5MaXN0ZW5lcixcbiAgQ29tZXRDaGF0VXJsc0Zvcm1hdHRlcixcbiAgQ29udmVyc2F0aW9uVXRpbHMsXG4gIFVzZXJNZW50aW9uU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgRGF0YVNvdXJjZSB9IGZyb20gXCIuLi9GcmFtZXdvcmsvRGF0YVNvdXJjZVwiO1xuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi9GcmFtZXdvcmsvQ2hhdENvbmZpZ3VyYXRvclwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VUlLaXQgfSBmcm9tIFwiLi4vQ29tZXRDaGF0VUlraXQvQ29tZXRDaGF0VUlLaXRcIjtcbmV4cG9ydCBjbGFzcyBNZXNzYWdlVXRpbHMgaW1wbGVtZW50cyBEYXRhU291cmNlIHtcbiAgLyoqXG4gKiBDcmVhdGVzIGFuIG9wdGlvbiB0byBlZGl0IG1lc3NhZ2UuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcmV0dXJuIHtDb21ldENoYXRNZXNzYWdlT3B0aW9ufSAtIFJldHVybnMgYSBuZXcgbWVzc2FnZSBvcHRpb24uXG4gKi9cblxuICBnZXRFZGl0T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5lZGl0TWVzc2FnZSxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkVESVRcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9lZGl0aWNvbi5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IG51bGwsXG4gICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gKiBDcmVhdGVzIGFuIG9wdGlvbiB0byByZWFjdCB0byBhIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcmV0dXJuIHtDb21ldENoYXRNZXNzYWdlT3B0aW9ufSAtIFJldHVybnMgYSBuZXcgbWVzc2FnZSBvcHRpb24uXG4gKi9cblxuICBnZXRSZWFjdGlvbk9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVhY3RUb01lc3NhZ2UsXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJSRUFDVFwiKSxcbiAgICAgIGljb25VUkw6IFwiYXNzZXRzL2FkZHJlYWN0aW9uLnN2Z1wiLFxuICAgICAgb25DbGljazogdW5kZWZpbmVkLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gZ2V0IGluZm8gYWJvdXQgYSBtZXNzYWdlLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG5cbiAgZ2V0TWVzc2FnZUluZm9PcHRpb24odGhlbWU6IENvbWV0Q2hhdFRoZW1lKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlT3B0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLm1lc3NhZ2VJbmZvcm1hdGlvbixcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIklORk9cIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9JbmZvLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgKiBDcmVhdGVzIGFuIG9wdGlvbiB0byBzZW5kIGEgcHJpdmF0ZSBtZXNzYWdlLlxuICAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAgKiBAcmV0dXJuIHtDb21ldENoYXRNZXNzYWdlT3B0aW9ufSAtIFJldHVybnMgYSBuZXcgbWVzc2FnZSBvcHRpb24uXG4gICovXG4gIGdldE1lc3NhZ2VQcml2YXRlbHlPcHRpb24odGhlbWU6IENvbWV0Q2hhdFRoZW1lKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlT3B0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnNlbmRNZXNzYWdlUHJpdmF0ZWx5LFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiTUVTU0FHRV9QUklWQVRFTFlcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9tZXNzYWdlLXByaXZhdGVseS5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IG51bGwsXG4gICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gKiBDcmVhdGVzIGFuIG9wdGlvbiB0byBkZWxldGUgYSBtZXNzYWdlLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG5cbiAgZ2V0RGVsZXRlT3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5kZWxldGVNZXNzYWdlLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiREVMRVRFXCIpLFxuICAgICAgaWNvblVSTDogXCJhc3NldHMvZGVsZXRlaWNvbi5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IG51bGwsXG4gICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gKiBDcmVhdGVzIGFuIG9wdGlvbiB0byByZXBseSB0byBhIG1lc3NhZ2UgaW4gYSB0aHJlYWQuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcmV0dXJuIHtDb21ldENoYXRNZXNzYWdlT3B0aW9ufSAtIFJldHVybnMgYSBuZXcgbWVzc2FnZSBvcHRpb24uXG4gKi9cblxuICBnZXRSZXBseUluVGhyZWFkT3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5yZXBseUluVGhyZWFkLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiUkVQTFlcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy90aHJlYWRpY29uLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAqIENyZWF0ZXMgYW4gb3B0aW9uIHRvIGNvcHkgYSBtZXNzYWdlLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG4gIGdldENvcHlPcHRpb24odGhlbWU6IENvbWV0Q2hhdFRoZW1lKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlT3B0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLmNvcHlNZXNzYWdlLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiQ09QWVwiKSxcbiAgICAgIGljb25VUkw6IFwiYXNzZXRzL0NvcHkuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICogQ2hlY2tzIGlmIGEgbWVzc2FnZSBpcyBzZW50IGJ5IGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Vc2VyfSBsb2dnZWRJblVzZXIgLSBUaGUgY3VycmVudCBsb2dnZWQgaW4gdXNlci5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSAtIFJldHVybnMgdHJ1ZSBpZiBtZXNzYWdlIGlzIHNlbnQgYnkgY3VycmVudCBsb2dnZWQgaW4gdXNlciwgb3RoZXJ3aXNlIGZhbHNlLlxuICovXG5cbiAgaXNTZW50QnlNZShcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuICApOiBib29sZWFuIHtcbiAgICByZXR1cm4gbG9nZ2VkSW5Vc2VyLmdldFVpZCgpID09PSBtZXNzYWdlLmdldFNlbmRlcigpLmdldFVpZCgpO1xuICB9XG4gIC8qKlxuICogRmV0Y2hlcyBvcHRpb25zIGZvciB0ZXh0IG1lc3NhZ2VzLlxuICogQHBhcmFtIHtDb21ldENoYXQuVXNlcn0gbG9nZ2VkSW5Vc2VyIC0gVGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdCAtIFRoZSBtZXNzYWdlIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cCAtIFRoZSBncm91cCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPn0gLSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAqL1xuXG4gIGdldFRleHRNZXNzYWdlT3B0aW9ucyhcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4ge1xuICAgIGxldCBpc1NlbnRCeU1lOiBib29sZWFuID0gdGhpcy5pc1NlbnRCeU1lKGxvZ2dlZEluVXNlciwgbWVzc2FnZU9iamVjdCk7XG4gICAgbGV0IGlzUGFydGljaXBhbnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBpZiAoXG4gICAgICBncm91cD8uZ2V0U2NvcGUoKSA9PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlclNjb3BlLnBhcnRpY2lwYW50XG4gICAgKSB7XG4gICAgICBpc1BhcnRpY2lwYW50ID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IG1lc3NhZ2VPcHRpb25MaXN0OiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiA9IFtdO1xuICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRSZWFjdGlvbk9wdGlvbih0aGVtZSkpO1xuICAgIGlmICghbWVzc2FnZU9iamVjdC5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldFJlcGx5SW5UaHJlYWRPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldENvcHlPcHRpb24odGhlbWUpKTtcbiAgICBpZiAoaXNTZW50QnlNZSB8fCAoIWlzUGFydGljaXBhbnQgJiYgZ3JvdXApKSB7XG4gICAgICBtZXNzYWdlT3B0aW9uTGlzdC5wdXNoKHRoaXMuZ2V0RWRpdE9wdGlvbih0aGVtZSkpO1xuICAgIH1cbiAgICBpZiAoaXNTZW50QnlNZSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldE1lc3NhZ2VJbmZvT3B0aW9uKHRoZW1lKSk7XG4gICAgfVxuICAgIGlmIChpc1NlbnRCeU1lIHx8ICghaXNQYXJ0aWNpcGFudCAmJiBncm91cCkpXG4gICAgICBtZXNzYWdlT3B0aW9uTGlzdC5wdXNoKHRoaXMuZ2V0RGVsZXRlT3B0aW9uKHRoZW1lKSk7XG4gICAgaWYgKGdyb3VwICYmICFpc1NlbnRCeU1lKSB7XG4gICAgICBtZXNzYWdlT3B0aW9uTGlzdC5wdXNoKHRoaXMuZ2V0TWVzc2FnZVByaXZhdGVseU9wdGlvbih0aGVtZSkpO1xuICAgIH1cbiAgICByZXR1cm4gbWVzc2FnZU9wdGlvbkxpc3Q7XG4gIH1cbiAgLyoqXG4gKiBGZXRjaGVzIG9wdGlvbnMgZm9yIGltYWdlIG1lc3NhZ2VzLlxuICogQHBhcmFtIHtDb21ldENoYXQuVXNlcn0gbG9nZ2VkSW5Vc2VyIC0gVGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdCAtIFRoZSBtZXNzYWdlIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cCAtIFRoZSBncm91cCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPn0gLSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAqL1xuICBnZXRJbWFnZU1lc3NhZ2VPcHRpb25zKFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSxcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiB7XG4gICAgbGV0IG1lc3NhZ2VPcHRpb25MaXN0OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10gPSBbXTtcbiAgICBtZXNzYWdlT3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldENvbW1vbk9wdGlvbnMoXG4gICAgICBsb2dnZWRJblVzZXIsXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgdGhlbWUsXG4gICAgICBncm91cFxuICAgICk7XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIC8qKlxuICogRmV0Y2hlcyBvcHRpb25zIGZvciB2aWRlbyBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IGxvZ2dlZEluVXNlciAtIFRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3QgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXAgLSAoT3B0aW9uYWwpIFRoZSBncm91cCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPn0gLSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAqL1xuICBnZXRWaWRlb01lc3NhZ2VPcHRpb25zKFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSxcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiB7XG4gICAgbGV0IG1lc3NhZ2VPcHRpb25MaXN0OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10gPSBbXTtcbiAgICBtZXNzYWdlT3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldENvbW1vbk9wdGlvbnMoXG4gICAgICBsb2dnZWRJblVzZXIsXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgdGhlbWUsXG4gICAgICBncm91cFxuICAgICk7XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIC8qKlxuICogRmV0Y2hlcyBvcHRpb25zIGZvciBhdWRpbyBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IGxvZ2dlZEluVXNlciAtIFRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3QgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXAgLSAoT3B0aW9uYWwpIFRoZSBncm91cCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPn0gLSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAqL1xuICBnZXRBdWRpb01lc3NhZ2VPcHRpb25zKFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSxcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiB7XG4gICAgbGV0IG1lc3NhZ2VPcHRpb25MaXN0OiBDb21ldENoYXRNZXNzYWdlT3B0aW9uW10gPSBbXTtcbiAgICBtZXNzYWdlT3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldENvbW1vbk9wdGlvbnMoXG4gICAgICBsb2dnZWRJblVzZXIsXG4gICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgdGhlbWUsXG4gICAgICBncm91cFxuICAgICk7XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIC8qKlxuICogRmV0Y2hlcyBvcHRpb25zIGZvciBmaWxlIG1lc3NhZ2VzLlxuICogQHBhcmFtIHtDb21ldENoYXQuVXNlcn0gbG9nZ2VkSW5Vc2VyIC0gVGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZU9iamVjdCAtIFRoZSBtZXNzYWdlIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0Lkdyb3VwfSBncm91cCAtIChPcHRpb25hbCkgVGhlIGdyb3VwIG9iamVjdC5cbiAqIEByZXR1cm4ge0FycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+fSAtIFJldHVybnMgYW4gYXJyYXkgb2YgbWVzc2FnZSBvcHRpb25zLlxuICovXG4gIGdldEZpbGVNZXNzYWdlT3B0aW9ucyhcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4ge1xuICAgIGxldCBtZXNzYWdlT3B0aW9uTGlzdDogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIHRoZW1lLFxuICAgICAgZ3JvdXBcbiAgICApO1xuICAgIHJldHVybiBtZXNzYWdlT3B0aW9uTGlzdDtcbiAgfVxuICBnZXRCb3R0b21WaWV3KFxuICAgIF9tZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgX2FsaWdubWVudDogTWVzc2FnZUJ1YmJsZUFsaWdubWVudFxuICApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBnZXRTY2hlZHVsZXJNZXNzYWdlVGVtcGxhdGUoKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSh7XG4gICAgICB0eXBlOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuc2NoZWR1bGVyLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG4gIGdldFRleHRNZXNzYWdlVGVtcGxhdGUoKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSh7XG4gICAgICB0eXBlOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dCxcbiAgICAgIGNhdGVnb3J5OiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG4gIGdldEF1ZGlvTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlLFxuICAgICAgb3B0aW9uczogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVzc2FnZU9wdGlvbnMsXG4gICAgfSk7XG4gIH1cbiAgZ2V0VmlkZW9NZXNzYWdlVGVtcGxhdGUoKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSh7XG4gICAgICB0eXBlOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UsXG4gICAgICBvcHRpb25zOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZXNzYWdlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuICBnZXRJbWFnZU1lc3NhZ2VUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZSxcbiAgICAgIGNhdGVnb3J5OiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG4gIGdldEdyb3VwQWN0aW9uVGVtcGxhdGUoKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSh7XG4gICAgICB0eXBlOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZ3JvdXBNZW1iZXIsXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmFjdGlvbixcbiAgICB9KTtcbiAgfVxuICBnZXRGaWxlTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGUsXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UsXG4gICAgICBvcHRpb25zOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZXNzYWdlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuICBnZXRGb3JtTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZvcm0sXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlLFxuICAgICAgb3B0aW9uczogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVzc2FnZU9wdGlvbnMsXG4gICAgfSk7XG4gIH1cblxuICBnZXRDYXJkTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmQsXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5LmludGVyYWN0aXZlLFxuICAgICAgb3B0aW9uczogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVzc2FnZU9wdGlvbnMsXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gKiBGdW5jdGlvbiB0byBjaGVjayBpZiBhIHVzZXIncyBzdGF0dXMgc2hvdWxkIGJlIHZpc2libGVcbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXJ9IHVzZXIgLSBUaGUgdXNlciB3aG9zZSBzdGF0dXMgdmlzaWJpbGl0eSBpcyB0byBiZSBjaGVja2VkLlxuICogQHJldHVybiB7Ym9vbGVhbn0gLSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdXNlcidzIHN0YXR1cyBzaG91bGQgYmUgaGlkZGVuIChibG9ja2VkIG9yIG9mZmxpbmUpLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqL1xuICBnZXRVc2VyU3RhdHVzVmlzaWJpbGl0eShcbiAgICB1c2VyPzogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgKSB7XG4gICAgbGV0IHVzZXJCbG9ja2VkRmxhZyA9IGZhbHNlO1xuICAgIGlmICh1c2VyKSB7XG4gICAgICBpZiAodXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHVzZXIuZ2V0SGFzQmxvY2tlZE1lKCkgfHwgdXNlci5nZXRTdGF0dXMoKSA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMudXNlclN0YXR1c1R5cGUub2ZmbGluZSkge1xuICAgICAgICB1c2VyQmxvY2tlZEZsYWcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXNlckJsb2NrZWRGbGFnO1xuICB9XG4gIGdldEFsbE1lc3NhZ2VUZW1wbGF0ZXMoKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlPiB7XG4gICAgcmV0dXJuIFtcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEltYWdlTWVzc2FnZVRlbXBsYXRlKCksXG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRWaWRlb01lc3NhZ2VUZW1wbGF0ZSgpLFxuICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEZpbGVNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEdyb3VwQWN0aW9uVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEZvcm1NZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldENhcmRNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFNjaGVkdWxlck1lc3NhZ2VUZW1wbGF0ZSgpLFxuICAgIF07XG4gIH1cbiAgZ2V0TWVzc2FnZVRlbXBsYXRlKFxuICAgIG1lc3NhZ2VUeXBlOiBzdHJpbmcsXG4gICAgbWVzc2FnZUNhdGVnb3J5OiBzdHJpbmdcbiAgKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHwgbnVsbCB7XG4gICAgbGV0IF90ZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKG1lc3NhZ2VDYXRlZ29yeSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCkge1xuICAgICAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0OlxuICAgICAgICAgIF90ZW1wbGF0ZSA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlVGVtcGxhdGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgX3RlbXBsYXRlID1cbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEltYWdlTWVzc2FnZVRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvOlxuICAgICAgICAgIF90ZW1wbGF0ZSA9XG4gICAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRWaWRlb01lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcjpcbiAgICAgICAgICBfdGVtcGxhdGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRHcm91cEFjdGlvblRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgX3RlbXBsYXRlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0RmlsZU1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbzpcbiAgICAgICAgICBfdGVtcGxhdGUgPVxuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlVGVtcGxhdGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZm9ybTpcbiAgICAgICAgICBfdGVtcGxhdGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRGb3JtTWVzc2FnZVRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmQ6XG4gICAgICAgICAgX3RlbXBsYXRlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0Q2FyZE1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5zY2hlZHVsZXI6XG4gICAgICAgICAgX3RlbXBsYXRlID1cbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFNjaGVkdWxlck1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3RlbXBsYXRlO1xuICB9XG4gIGdldE1lc3NhZ2VPcHRpb25zKFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSxcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiB7XG4gICAgbGV0IF9vcHRpb25MaXN0OiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiA9IFtdO1xuICAgIGlmIChcbiAgICAgIG1lc3NhZ2VPYmplY3QuZ2V0Q2F0ZWdvcnkoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2VcbiAgICApIHtcbiAgICAgIHN3aXRjaCAobWVzc2FnZU9iamVjdC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDpcbiAgICAgICAgICBfb3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlT3B0aW9ucyhcbiAgICAgICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgICAgICB0aGVtZSxcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRJbWFnZU1lc3NhZ2VPcHRpb25zKFxuICAgICAgICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgIHRoZW1lLFxuICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbzpcbiAgICAgICAgICBfb3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFZpZGVvTWVzc2FnZU9wdGlvbnMoXG4gICAgICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgICAgdGhlbWUsXG4gICAgICAgICAgICBncm91cFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyOlxuICAgICAgICAgIF9vcHRpb25MaXN0ID0gW107XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRGaWxlTWVzc2FnZU9wdGlvbnMoXG4gICAgICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgICAgdGhlbWUsXG4gICAgICAgICAgICBncm91cFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvOlxuICAgICAgICAgIF9vcHRpb25MaXN0ID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlT3B0aW9ucyhcbiAgICAgICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgICAgICB0aGVtZSxcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZU9iamVjdC5nZXRDYXRlZ29yeSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY3VzdG9tIHx8XG4gICAgICBtZXNzYWdlT2JqZWN0LmdldENhdGVnb3J5KCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICkge1xuICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgIHRoZW1lLFxuICAgICAgICBncm91cFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIF9vcHRpb25MaXN0O1xuICB9XG4gIGdldENvbW1vbk9wdGlvbnMoXG4gICAgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICBtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+IHtcbiAgICBsZXQgaXNTZW50QnlNZTogYm9vbGVhbiA9IHRoaXMuaXNTZW50QnlNZShsb2dnZWRJblVzZXIsIG1lc3NhZ2VPYmplY3QpO1xuICAgIGxldCBpc1BhcnRpY2lwYW50OiBib29sZWFuID0gZmFsc2U7XG4gICAgaWYgKGdyb3VwPy5nZXRTY29wZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQpXG4gICAgICBpc1BhcnRpY2lwYW50ID0gdHJ1ZTtcbiAgICBsZXQgbWVzc2FnZU9wdGlvbkxpc3Q6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+ID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldFJlYWN0aW9uT3B0aW9uKHRoZW1lKSk7XG4gICAgaWYgKCFtZXNzYWdlT2JqZWN0Py5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldFJlcGx5SW5UaHJlYWRPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgaWYgKGlzU2VudEJ5TWUpIHtcbiAgICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRNZXNzYWdlSW5mb09wdGlvbih0aGVtZSkpO1xuICAgIH1cbiAgICBpZiAoaXNTZW50QnlNZSB8fCAoIWlzUGFydGljaXBhbnQgJiYgZ3JvdXApKVxuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldERlbGV0ZU9wdGlvbih0aGVtZSkpO1xuICAgIGlmIChncm91cCAmJiAhaXNTZW50QnlNZSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldE1lc3NhZ2VQcml2YXRlbHlPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIGdldEFsbE1lc3NhZ2VUeXBlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcixcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5mb3JtLFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmQsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuc2NoZWR1bGVyLFxuICAgIF07XG4gIH1cbiAgYWRkTGlzdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIjxNZXNzYWdlIFV0aWxzPlwiO1xuICB9XG4gIGdldEFsbE1lc3NhZ2VDYXRlZ29yaWVzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBbXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUsXG4gICAgXTtcbiAgfVxuICBnZXRBdXhpbGlhcnlPcHRpb25zKFxuICAgIGlkOiBDb21wb3NlcklkLFxuICAgIHVzZXI/OiBDb21ldENoYXQuVXNlcixcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBhbnkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwibWVzc2FnZVV0aWxzXCI7XG4gIH1cbiAgZ2V0QWN0aW9uTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IG1lc3NhZ2UuZ2V0QWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IGFjdGlvbkJ5ID0gbWVzc2FnZS5nZXRBY3Rpb25CeSgpO1xuICAgICAgICBjb25zdCBhY3Rpb25PbiA9IG1lc3NhZ2UuZ2V0QWN0aW9uT24oKTtcblxuICAgICAgICBjb25zdCBieVN0cmluZyA9IChhY3Rpb25CeSBhcyBDb21ldENoYXQuVXNlcikuZ2V0TmFtZSgpO1xuICAgICAgICBjb25zdCBmb3JTdHJpbmcgPVxuICAgICAgICAgIGFjdGlvbiA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEIHx8XG4gICAgICAgICAgICBhY3Rpb24gPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlRcbiAgICAgICAgICAgID8gXCJcIlxuICAgICAgICAgICAgOiAoYWN0aW9uT24gYXMgQ29tZXRDaGF0LlVzZXIpLmdldE5hbWUoKTtcblxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQ6XG4gICAgICAgICAgICByZXR1cm4gYCR7YnlTdHJpbmd9ICR7bG9jYWxpemUoXCJBRERFRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkpPSU5FRFwiKX1gO1xuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkxFRlRcIil9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIktJQ0tFRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkJBTk5FRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOlxuICAgICAgICAgICAgcmV0dXJuIGAke2J5U3RyaW5nfSAke2xvY2FsaXplKFwiVU5CQU5ORURcIil9ICR7Zm9yU3RyaW5nfWA7XG4gICAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0U6XG4gICAgICAgICAgICByZXR1cm4gYCR7YnlTdHJpbmd9ICR7bG9jYWxpemUoXG4gICAgICAgICAgICAgIFwiTUFERVwiXG4gICAgICAgICAgICApfSAke2ZvclN0cmluZ30gJHttZXNzYWdlLmdldE5ld1Njb3BlKCl9YDtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIGltYWdlQXR0YWNobWVudE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJBVFRBQ0hfSU1BR0VcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9waG90b2xpYnJhcnkuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gIH1cbiAgdmlkZW9BdHRhY2htZW50T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbyxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkFUVEFDSF9WSURFT1wiKSxcbiAgICAgIGljb25VUkw6IFwiYXNzZXRzL3ZpZGVvLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICB9XG4gIGF1ZGlvQXR0YWNobWVudE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8sXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJBVFRBQ0hfQVVESU9cIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9hdWRpby1maWxlLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICB9XG4gIGZpbGVBdHRhY2htZW50T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiQVRUQUNIX0ZJTEVcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9hdHRhY2htZW50LWZpbGUuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gIH1cbiAgZ2V0QXR0YWNobWVudE9wdGlvbnMoXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIHVzZXI/OiBDb21ldENoYXQuVXNlcixcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cCxcbiAgICBpZD86IENvbXBvc2VySWRcbiAgKTogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uW10ge1xuICAgIGxldCBhY3Rpb25zOiBBcnJheTxDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24+ID0gW1xuICAgICAgdGhpcy5pbWFnZUF0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy52aWRlb0F0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy5hdWRpb0F0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy5maWxlQXR0YWNobWVudE9wdGlvbih0aGVtZSksXG4gICAgXTtcbiAgICByZXR1cm4gYWN0aW9ucztcbiAgfVxuXG4gIGdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGFkZGl0aW9uYWxDb25maWd1cmF0aW9uczogYW55XG4gICk6IHN0cmluZyB7XG4gICAgbGV0IGNvbmZpZyA9IHtcbiAgICAgIC4uLmFkZGl0aW9uYWxDb25maWd1cmF0aW9ucyxcbiAgICAgIHRleHRGb3JtYXR0ZXJzOlxuICAgICAgICBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnM/LnRleHRGb3JtYXR0ZXJzICYmXG4gICAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zPy50ZXh0Rm9ybWF0dGVycy5sZW5ndGhcbiAgICAgICAgICA/IFsuLi5hZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMudGV4dEZvcm1hdHRlcnNdXG4gICAgICAgICAgOiBbdGhpcy5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoeyB0aGVtZTogYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zLnRoZW1lLCBkaXNhYmxlTWVudGlvbnM6IGFkZGl0aW9uYWxDb25maWd1cmF0aW9ucy5kaXNhYmxlTWVudGlvbnMgfSldLFxuICAgIH07XG4gICAgbGV0IG1lc3NhZ2UgPSBDb252ZXJzYXRpb25VdGlscy5nZXRMYXN0Q29udmVyc2F0aW9uTWVzc2FnZShcbiAgICAgIGNvbnZlcnNhdGlvbixcbiAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgIGNvbmZpZ1xuICAgICk7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3QgPSBjb252ZXJzYXRpb24/LmdldExhc3RNZXNzYWdlKCk7XG4gICAgaWYgKG1lc3NhZ2VPYmplY3QpIHtcbiAgICAgIGxldCB0ZXh0Rm9ybWF0dGVyczogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBjb25maWcudGV4dEZvcm1hdHRlcnM7XG4gICAgICBpZiAoY29uZmlnICYmICFjb25maWcuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tcbiAgICAgICAgICAgICAgaVxuICAgICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VPYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5nZXRNZW50aW9uZWRVc2VycygpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TG9nZ2VkSW5Vc2VyKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPVxuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICAgICAgICBhbGlnbm1lbnQ6IG51bGwsXG4gICAgICAgICAgICAgIHRoZW1lOiBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMudGhlbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0Rm9ybWF0dGVycy5wdXNoKG1lbnRpb25zVGV4dEZvcm1hdHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlT2JqZWN0ICYmXG4gICAgICAgIG1lc3NhZ2VPYmplY3QgaW5zdGFuY2VvZiBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IHRleHRGb3JtYXR0ZXJzW2ldLmdldEZvcm1hdHRlZFRleHQobWVzc2FnZSwgeyBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudC5jb252ZXJzYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBzdHlsZWQgQCBmb3IgZXZlcnkgbWVudGlvbiBpbiB0aGUgdGV4dCBieSBtYXRjaGluZyB1aWRcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN1YnRpdGxlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgZ2V0TWVudGlvbnNGb3JtYXR0ZWRUZXh0KFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSxcbiAgICBzdWJ0aXRsZTogc3RyaW5nLFxuICAgIG1lbnRpb25zRm9ybWF0dGVyUGFyYW1zOiB7XG4gICAgICBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudDtcbiAgICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZTtcbiAgICB9XG4gICkge1xuICAgIGNvbnN0IHJlZ2V4ID0gLzxAdWlkOiguKj8pPi9nO1xuICAgIGxldCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtZXNzYWdlVGV4dFRtcDogc3RyaW5nID0gc3VidGl0bGU7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzOiBBcnJheTxDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cE1lbWJlcj4gPSBbXTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBjb21ldENoYXRVc2Vycy5wdXNoKHVzZXIpO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgbGV0IG1lbnRpb25zRm9ybWF0dGVyID0gdGhpcy5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoXG4gICAgICBtZW50aW9uc0Zvcm1hdHRlclBhcmFtc1xuICAgICk7XG4gICAgbWVudGlvbnNGb3JtYXR0ZXIuc2V0Q2xhc3NlcyhbXCJjYy1tZW50aW9uc1wiXSk7XG4gICAgbWVudGlvbnNGb3JtYXR0ZXIuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhjb21ldENoYXRVc2Vycyk7XG4gICAgbWVzc2FnZVRleHRUbXAgPSBtZW50aW9uc0Zvcm1hdHRlci5nZXRGb3JtYXR0ZWRUZXh0KFxuICAgICAgbWVzc2FnZVRleHRUbXAsXG4gICAgICBtZW50aW9uc0Zvcm1hdHRlclBhcmFtc1xuICAgICkgYXMgc3RyaW5nO1xuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIGdldEFJT3B0aW9ucyhcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgaWQ/OiBNYXA8U3RyaW5nLCBhbnk+XG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB8IENvbWV0Q2hhdEFjdGlvbnNWaWV3PiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0QWxsVGV4dEZvcm1hdHRlcnMoZm9ybWF0dGVyUGFyYW1zOiBhbnkpOiBDb21ldENoYXRUZXh0Rm9ybWF0dGVyW10ge1xuICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgY29uc3QgbWVudGlvbnNGb3JtYXR0ZXIgPSBmb3JtYXR0ZXJQYXJhbXMuZGlzYWJsZU1lbnRpb25zID8gbnVsbCA6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lbnRpb25zVGV4dEZvcm1hdHRlcihcbiAgICAgIGZvcm1hdHRlclBhcmFtc1xuICAgICk7XG4gICAgY29uc3QgdXJsVGV4dEZvcm1hdHRlciA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFVybFRleHRGb3JtYXR0ZXIoZm9ybWF0dGVyUGFyYW1zKTtcbiAgICBpZiAobWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgIGZvcm1hdHRlcnMucHVzaChtZW50aW9uc0Zvcm1hdHRlcik7XG4gICAgfVxuICAgIGlmICh1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICBmb3JtYXR0ZXJzLnB1c2godXJsVGV4dEZvcm1hdHRlcik7XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXR0ZXJzO1xuICB9XG5cbiAgZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHBhcmFtczogYW55KTogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIge1xuICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSBuZXcgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIoKTtcbiAgICBpZiAocGFyYW1zICYmIHBhcmFtcy50aGVtZSkge1xuICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbXBvc2VyTWVudGlvblN0eWxlKFxuICAgICAgICBuZXcgVXNlck1lbnRpb25TdHlsZSh7XG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIG1lbnRpb25UZXh0QmFja2dyb3VuZDogXCJcIixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0Q29udmVyc2F0aW9uTWVudGlvblN0eWxlKFxuICAgICAgICBuZXcgVXNlck1lbnRpb25TdHlsZSh7XG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIG1lbnRpb25UZXh0QmFja2dyb3VuZDogXCJcIixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0UmlnaHRCdWJibGVNZW50aW9uU3R5bGUoXG4gICAgICAgIG5ldyBVc2VyTWVudGlvblN0eWxlKHtcbiAgICAgICAgICBsb2dnZWRJblVzZXJUZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRUZXJ0aWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0VGVydGlhcnkoKSxcbiAgICAgICAgICBtZW50aW9uVGV4dEJhY2tncm91bmQ6IFwiXCIsXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldExlZnRCdWJibGVNZW50aW9uU3R5bGUoXG4gICAgICAgIG5ldyBVc2VyTWVudGlvblN0eWxlKHtcbiAgICAgICAgICBsb2dnZWRJblVzZXJUZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEJhY2tncm91bmQ6IFwiXCIsXG4gICAgICAgICAgbWVudGlvblRleHRGb250OiBmb250SGVscGVyKHBhcmFtcy50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgICAgICBtZW50aW9uVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgICAgbWVudGlvblRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lbnRpb25zVGV4dEZvcm1hdHRlcjtcbiAgfVxuXG4gIGdldFVybFRleHRGb3JtYXR0ZXIocGFyYW1zOiBhbnkgPSB7fSk6IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIge1xuICAgIGxldCB1cmxUZXh0Rm9ybWF0dGVyID0gbmV3IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIoW1xuICAgICAgLyhodHRwcz86XFwvXFwvW15cXHNdKykvZyxcbiAgICBdKTtcbiAgICBpZiAocGFyYW1zLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIuc2V0U3R5bGUoe1xuICAgICAgICBmb3JtYXR0ZWRUZXh0Q29sb3I6IHBhcmFtcy50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgZm9ybWF0dGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIuc2V0U3R5bGUoe1xuICAgICAgICBmb3JtYXR0ZWRUZXh0Q29sb3I6IHBhcmFtcy50aGVtZS5wYWxldHRlLmdldFRlcnRpYXJ5KCksXG4gICAgICAgIGZvcm1hdHRlZFRleHRGb250OiBmb250SGVscGVyKHBhcmFtcy50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdXJsVGV4dEZvcm1hdHRlcjtcbiAgfVxufVxuZXhwb3J0IHR5cGUgQ29tcG9zZXJJZCA9IHtcbiAgcGFyZW50TWVzc2FnZUlkOiBudW1iZXIgfCBudWxsO1xuICB1c2VyOiBzdHJpbmcgfCBudWxsO1xuICBncm91cDogc3RyaW5nIHwgbnVsbDtcbn07XG4iXX0=