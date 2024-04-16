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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVzc2FnZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9TaGFyZWQvVXRpbHMvTWVzc2FnZVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxzQkFBc0IsRUFDdEIsc0JBQXNCLEVBQ3RCLHdCQUF3QixFQUN4Qiw4QkFBOEIsRUFFOUIsUUFBUSxFQUNSLHVCQUF1QixFQUN2QixVQUFVLEVBRVYscUJBQXFCLEdBQ3RCLE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUNMLDBCQUEwQixFQUUxQiwyQkFBMkIsRUFDM0Isc0JBQXNCLEVBQ3RCLGlCQUFpQixFQUNqQixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFFM0QsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFakUsTUFBTSxPQUFPLFlBQVk7SUFDdkI7Ozs7S0FJQztJQUVELGFBQWEsQ0FBQyxLQUFxQjtRQUNqQyxPQUFPLElBQUksc0JBQXNCLENBQUM7WUFDaEMsRUFBRSxFQUFFLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxXQUFXO1lBQ3JELEtBQUssRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7WUFDdEMsZUFBZSxFQUFFLGFBQWE7WUFDOUIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUNqRCxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUU7U0FDekMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNEOzs7O0tBSUM7SUFF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QUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQzthQUM3RCxDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO2dCQUN4QixrQkFBa0IsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7Z0JBQ3RELGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7YUFDN0QsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxPQUFPLGdCQUFnQixDQUFDO0lBQzFCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24sXG4gIE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQsXG4gIENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSxcbiAgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uLFxuICBDb21ldENoYXRUaGVtZSxcbiAgbG9jYWxpemUsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBmb250SGVscGVyLFxuICBDb21ldENoYXRBY3Rpb25zVmlldyxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIsXG4gIENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIsXG4gIENvbnZlcnNhdGlvblV0aWxzLFxuICBVc2VyTWVudGlvblN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IERhdGFTb3VyY2UgfSBmcm9tIFwiLi4vRnJhbWV3b3JrL0RhdGFTb3VyY2VcIjtcbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdFVJS2l0IH0gZnJvbSBcIi4uL0NvbWV0Q2hhdFVJa2l0L0NvbWV0Q2hhdFVJS2l0XCI7XG5leHBvcnQgY2xhc3MgTWVzc2FnZVV0aWxzIGltcGxlbWVudHMgRGF0YVNvdXJjZSB7XG4gIC8qKlxuICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gZWRpdCBtZXNzYWdlLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG5cbiAgZ2V0RWRpdE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZWRpdE1lc3NhZ2UsXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJFRElUXCIpLFxuICAgICAgaWNvblVSTDogXCJhc3NldHMvZWRpdGljb24uc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gcmVhY3QgdG8gYSBtZXNzYWdlLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG5cbiAgZ2V0UmVhY3Rpb25PcHRpb24odGhlbWU6IENvbWV0Q2hhdFRoZW1lKTogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlT3B0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlT3B0aW9uLnJlYWN0VG9NZXNzYWdlLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiUkVBQ1RcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9hZGRyZWFjdGlvbi5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IHVuZGVmaW5lZCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAqIENyZWF0ZXMgYW4gb3B0aW9uIHRvIGdldCBpbmZvIGFib3V0IGEgbWVzc2FnZS5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEByZXR1cm4ge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb259IC0gUmV0dXJucyBhIG5ldyBtZXNzYWdlIG9wdGlvbi5cbiAqL1xuXG4gIGdldE1lc3NhZ2VJbmZvT3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5tZXNzYWdlSW5mb3JtYXRpb24sXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJJTkZPXCIpLFxuICAgICAgaWNvblVSTDogXCJhc3NldHMvSW5mby5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IG51bGwsXG4gICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gc2VuZCBhIHByaXZhdGUgbWVzc2FnZS5cbiAgKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICAqL1xuICBnZXRNZXNzYWdlUHJpdmF0ZWx5T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5zZW5kTWVzc2FnZVByaXZhdGVseSxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIk1FU1NBR0VfUFJJVkFURUxZXCIpLFxuICAgICAgaWNvblVSTDogXCJhc3NldHMvbWVzc2FnZS1wcml2YXRlbHkuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gZGVsZXRlIGEgbWVzc2FnZS5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEByZXR1cm4ge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb259IC0gUmV0dXJucyBhIG5ldyBtZXNzYWdlIG9wdGlvbi5cbiAqL1xuXG4gIGdldERlbGV0ZU9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24uZGVsZXRlTWVzc2FnZSxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkRFTEVURVwiKSxcbiAgICAgIGljb25VUkw6IFwiYXNzZXRzL2RlbGV0ZWljb24uc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgIH0pO1xuICB9XG4gIC8qKlxuICogQ3JlYXRlcyBhbiBvcHRpb24gdG8gcmVwbHkgdG8gYSBtZXNzYWdlIGluIGEgdGhyZWFkLlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHJldHVybiB7Q29tZXRDaGF0TWVzc2FnZU9wdGlvbn0gLSBSZXR1cm5zIGEgbmV3IG1lc3NhZ2Ugb3B0aW9uLlxuICovXG5cbiAgZ2V0UmVwbHlJblRocmVhZE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlT3B0aW9uIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VPcHRpb24ucmVwbHlJblRocmVhZCxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIlJFUExZXCIpLFxuICAgICAgaWNvblVSTDogXCJhc3NldHMvdGhyZWFkaWNvbi5zdmdcIixcbiAgICAgIG9uQ2xpY2s6IG51bGwsXG4gICAgICBpY29uVGludDogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gKiBDcmVhdGVzIGFuIG9wdGlvbiB0byBjb3B5IGEgbWVzc2FnZS5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0VGhlbWV9IHRoZW1lIC0gVGhlIHRoZW1lIG9iamVjdC5cbiAqIEByZXR1cm4ge0NvbWV0Q2hhdE1lc3NhZ2VPcHRpb259IC0gUmV0dXJucyBhIG5ldyBtZXNzYWdlIG9wdGlvbi5cbiAqL1xuICBnZXRDb3B5T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbih7XG4gICAgICBpZDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZU9wdGlvbi5jb3B5TWVzc2FnZSxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkNPUFlcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9Db3B5LnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICB9KTtcbiAgfVxuICAvKipcbiAqIENoZWNrcyBpZiBhIG1lc3NhZ2UgaXMgc2VudCBieSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuVXNlcn0gbG9nZ2VkSW5Vc2VyIC0gVGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5CYXNlTWVzc2FnZX0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIGNoZWNrLlxuICogQHJldHVybiB7Ym9vbGVhbn0gLSBSZXR1cm5zIHRydWUgaWYgbWVzc2FnZSBpcyBzZW50IGJ5IGN1cnJlbnQgbG9nZ2VkIGluIHVzZXIsIG90aGVyd2lzZSBmYWxzZS5cbiAqL1xuXG4gIGlzU2VudEJ5TWUoXG4gICAgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICBtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2VcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGxvZ2dlZEluVXNlci5nZXRVaWQoKSA9PT0gbWVzc2FnZS5nZXRTZW5kZXIoKS5nZXRVaWQoKTtcbiAgfVxuICAvKipcbiAqIEZldGNoZXMgb3B0aW9ucyBmb3IgdGV4dCBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IGxvZ2dlZEluVXNlciAtIFRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3QgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXAgLSBUaGUgZ3JvdXAgb2JqZWN0LlxuICogQHJldHVybiB7QXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj59IC0gUmV0dXJucyBhbiBhcnJheSBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gKi9cblxuICBnZXRUZXh0TWVzc2FnZU9wdGlvbnMoXG4gICAgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICBtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+IHtcbiAgICBsZXQgaXNTZW50QnlNZTogYm9vbGVhbiA9IHRoaXMuaXNTZW50QnlNZShsb2dnZWRJblVzZXIsIG1lc3NhZ2VPYmplY3QpO1xuICAgIGxldCBpc1BhcnRpY2lwYW50OiBib29sZWFuID0gZmFsc2U7XG4gICAgaWYgKFxuICAgICAgZ3JvdXA/LmdldFNjb3BlKCkgPT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJTY29wZS5wYXJ0aWNpcGFudFxuICAgICkge1xuICAgICAgaXNQYXJ0aWNpcGFudCA9IHRydWU7XG4gICAgfVxuICAgIGxldCBtZXNzYWdlT3B0aW9uTGlzdDogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4gPSBbXTtcbiAgICBtZXNzYWdlT3B0aW9uTGlzdC5wdXNoKHRoaXMuZ2V0UmVhY3Rpb25PcHRpb24odGhlbWUpKTtcbiAgICBpZiAoIW1lc3NhZ2VPYmplY3QuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRSZXBseUluVGhyZWFkT3B0aW9uKHRoZW1lKSk7XG4gICAgfVxuICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRDb3B5T3B0aW9uKHRoZW1lKSk7XG4gICAgaWYgKGlzU2VudEJ5TWUgfHwgKCFpc1BhcnRpY2lwYW50ICYmIGdyb3VwKSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldEVkaXRPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgaWYgKGlzU2VudEJ5TWUpIHtcbiAgICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRNZXNzYWdlSW5mb09wdGlvbih0aGVtZSkpO1xuICAgIH1cbiAgICBpZiAoaXNTZW50QnlNZSB8fCAoIWlzUGFydGljaXBhbnQgJiYgZ3JvdXApKVxuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldERlbGV0ZU9wdGlvbih0aGVtZSkpO1xuICAgIGlmIChncm91cCAmJiAhaXNTZW50QnlNZSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldE1lc3NhZ2VQcml2YXRlbHlPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIC8qKlxuICogRmV0Y2hlcyBvcHRpb25zIGZvciBpbWFnZSBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IGxvZ2dlZEluVXNlciAtIFRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3QgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXAgLSBUaGUgZ3JvdXAgb2JqZWN0LlxuICogQHJldHVybiB7QXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj59IC0gUmV0dXJucyBhbiBhcnJheSBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gKi9cbiAgZ2V0SW1hZ2VNZXNzYWdlT3B0aW9ucyhcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4ge1xuICAgIGxldCBtZXNzYWdlT3B0aW9uTGlzdDogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIHRoZW1lLFxuICAgICAgZ3JvdXBcbiAgICApO1xuICAgIHJldHVybiBtZXNzYWdlT3B0aW9uTGlzdDtcbiAgfVxuICAvKipcbiAqIEZldGNoZXMgb3B0aW9ucyBmb3IgdmlkZW8gbWVzc2FnZXMuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Vc2VyfSBsb2dnZWRJblVzZXIgLSBUaGUgY3VycmVudCBsb2dnZWQgaW4gdXNlci5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlT2JqZWN0IC0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHBhcmFtIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwIC0gKE9wdGlvbmFsKSBUaGUgZ3JvdXAgb2JqZWN0LlxuICogQHJldHVybiB7QXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj59IC0gUmV0dXJucyBhbiBhcnJheSBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gKi9cbiAgZ2V0VmlkZW9NZXNzYWdlT3B0aW9ucyhcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4ge1xuICAgIGxldCBtZXNzYWdlT3B0aW9uTGlzdDogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIHRoZW1lLFxuICAgICAgZ3JvdXBcbiAgICApO1xuICAgIHJldHVybiBtZXNzYWdlT3B0aW9uTGlzdDtcbiAgfVxuICAvKipcbiAqIEZldGNoZXMgb3B0aW9ucyBmb3IgYXVkaW8gbWVzc2FnZXMuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Vc2VyfSBsb2dnZWRJblVzZXIgLSBUaGUgY3VycmVudCBsb2dnZWQgaW4gdXNlci5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LkJhc2VNZXNzYWdlfSBtZXNzYWdlT2JqZWN0IC0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICogQHBhcmFtIHtDb21ldENoYXRUaGVtZX0gdGhlbWUgLSBUaGUgdGhlbWUgb2JqZWN0LlxuICogQHBhcmFtIHtDb21ldENoYXQuR3JvdXB9IGdyb3VwIC0gKE9wdGlvbmFsKSBUaGUgZ3JvdXAgb2JqZWN0LlxuICogQHJldHVybiB7QXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj59IC0gUmV0dXJucyBhbiBhcnJheSBvZiBtZXNzYWdlIG9wdGlvbnMuXG4gKi9cbiAgZ2V0QXVkaW9NZXNzYWdlT3B0aW9ucyhcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSxcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgZ3JvdXA/OiBDb21ldENoYXQuR3JvdXBcbiAgKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZU9wdGlvbj4ge1xuICAgIGxldCBtZXNzYWdlT3B0aW9uTGlzdDogQ29tZXRDaGF0TWVzc2FnZU9wdGlvbltdID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgIHRoZW1lLFxuICAgICAgZ3JvdXBcbiAgICApO1xuICAgIHJldHVybiBtZXNzYWdlT3B0aW9uTGlzdDtcbiAgfVxuICAvKipcbiAqIEZldGNoZXMgb3B0aW9ucyBmb3IgZmlsZSBtZXNzYWdlcy5cbiAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IGxvZ2dlZEluVXNlciAtIFRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyLlxuICogQHBhcmFtIHtDb21ldENoYXQuQmFzZU1lc3NhZ2V9IG1lc3NhZ2VPYmplY3QgLSBUaGUgbWVzc2FnZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdFRoZW1lfSB0aGVtZSAtIFRoZSB0aGVtZSBvYmplY3QuXG4gKiBAcGFyYW0ge0NvbWV0Q2hhdC5Hcm91cH0gZ3JvdXAgLSAoT3B0aW9uYWwpIFRoZSBncm91cCBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPn0gLSBSZXR1cm5zIGFuIGFycmF5IG9mIG1lc3NhZ2Ugb3B0aW9ucy5cbiAqL1xuICBnZXRGaWxlTWVzc2FnZU9wdGlvbnMoXG4gICAgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICBtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+IHtcbiAgICBsZXQgbWVzc2FnZU9wdGlvbkxpc3Q6IENvbWV0Q2hhdE1lc3NhZ2VPcHRpb25bXSA9IFtdO1xuICAgIG1lc3NhZ2VPcHRpb25MaXN0ID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0Q29tbW9uT3B0aW9ucyhcbiAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICB0aGVtZSxcbiAgICAgIGdyb3VwXG4gICAgKTtcbiAgICByZXR1cm4gbWVzc2FnZU9wdGlvbkxpc3Q7XG4gIH1cbiAgZ2V0Qm90dG9tVmlldyhcbiAgICBfbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIF9hbGlnbm1lbnQ6IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnRcbiAgKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0U2NoZWR1bGVyTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnNjaGVkdWxlcixcbiAgICAgIGNhdGVnb3J5OiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUsXG4gICAgICBvcHRpb25zOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZXNzYWdlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuICBnZXRUZXh0TWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQsXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UsXG4gICAgICBvcHRpb25zOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZXNzYWdlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuICBnZXRBdWRpb01lc3NhZ2VUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbyxcbiAgICAgIGNhdGVnb3J5OiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG4gIGdldFZpZGVvTWVzc2FnZVRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlLFxuICAgICAgb3B0aW9uczogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVzc2FnZU9wdGlvbnMsXG4gICAgfSk7XG4gIH1cbiAgZ2V0SW1hZ2VNZXNzYWdlVGVtcGxhdGUoKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHtcbiAgICByZXR1cm4gbmV3IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSh7XG4gICAgICB0eXBlOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBjYXRlZ29yeTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2UsXG4gICAgICBvcHRpb25zOiBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZXNzYWdlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuICBnZXRHcm91cEFjdGlvblRlbXBsYXRlKCk6IENvbWV0Q2hhdE1lc3NhZ2VUZW1wbGF0ZSB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUoe1xuICAgICAgdHlwZTogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24sXG4gICAgfSk7XG4gIH1cbiAgZ2V0RmlsZU1lc3NhZ2VUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5tZXNzYWdlLFxuICAgICAgb3B0aW9uczogQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVzc2FnZU9wdGlvbnMsXG4gICAgfSk7XG4gIH1cbiAgZ2V0Rm9ybU1lc3NhZ2VUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5mb3JtLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q2FyZE1lc3NhZ2VUZW1wbGF0ZSgpOiBDb21ldENoYXRNZXNzYWdlVGVtcGxhdGUge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlKHtcbiAgICAgIHR5cGU6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5jYXJkLFxuICAgICAgY2F0ZWdvcnk6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZSxcbiAgICAgIG9wdGlvbnM6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lc3NhZ2VPcHRpb25zLFxuICAgIH0pO1xuICB9XG4gIGdldEFsbE1lc3NhZ2VUZW1wbGF0ZXMoKTogQXJyYXk8Q29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlPiB7XG4gICAgcmV0dXJuIFtcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEltYWdlTWVzc2FnZVRlbXBsYXRlKCksXG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRWaWRlb01lc3NhZ2VUZW1wbGF0ZSgpLFxuICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEZpbGVNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEdyb3VwQWN0aW9uVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEZvcm1NZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldENhcmRNZXNzYWdlVGVtcGxhdGUoKSxcbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFNjaGVkdWxlck1lc3NhZ2VUZW1wbGF0ZSgpLFxuICAgIF07XG4gIH1cbiAgZ2V0TWVzc2FnZVRlbXBsYXRlKFxuICAgIG1lc3NhZ2VUeXBlOiBzdHJpbmcsXG4gICAgbWVzc2FnZUNhdGVnb3J5OiBzdHJpbmdcbiAgKTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHwgbnVsbCB7XG4gICAgbGV0IF90ZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKG1lc3NhZ2VDYXRlZ29yeSAhPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY2FsbCkge1xuICAgICAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy50ZXh0OlxuICAgICAgICAgIF90ZW1wbGF0ZSA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlVGVtcGxhdGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgX3RlbXBsYXRlID1cbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEltYWdlTWVzc2FnZVRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvOlxuICAgICAgICAgIF90ZW1wbGF0ZSA9XG4gICAgICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRWaWRlb01lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcjpcbiAgICAgICAgICBfdGVtcGxhdGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRHcm91cEFjdGlvblRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgX3RlbXBsYXRlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0RmlsZU1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbzpcbiAgICAgICAgICBfdGVtcGxhdGUgPVxuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlVGVtcGxhdGUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZm9ybTpcbiAgICAgICAgICBfdGVtcGxhdGUgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRGb3JtTWVzc2FnZVRlbXBsYXRlKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmQ6XG4gICAgICAgICAgX3RlbXBsYXRlID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0Q2FyZE1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5zY2hlZHVsZXI6XG4gICAgICAgICAgX3RlbXBsYXRlID1cbiAgICAgICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFNjaGVkdWxlck1lc3NhZ2VUZW1wbGF0ZSgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3RlbXBsYXRlO1xuICB9XG4gIGdldE1lc3NhZ2VPcHRpb25zKFxuICAgIGxvZ2dlZEluVXNlcjogQ29tZXRDaGF0LlVzZXIsXG4gICAgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLFxuICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZSxcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiB7XG4gICAgbGV0IF9vcHRpb25MaXN0OiBBcnJheTxDb21ldENoYXRNZXNzYWdlT3B0aW9uPiA9IFtdO1xuICAgIGlmIChcbiAgICAgIG1lc3NhZ2VPYmplY3QuZ2V0Q2F0ZWdvcnkoKSA9PVxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZUNhdGVnb3J5Lm1lc3NhZ2VcbiAgICApIHtcbiAgICAgIHN3aXRjaCAobWVzc2FnZU9iamVjdC5nZXRUeXBlKCkpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudGV4dDpcbiAgICAgICAgICBfb3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFRleHRNZXNzYWdlT3B0aW9ucyhcbiAgICAgICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgICAgICB0aGVtZSxcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRJbWFnZU1lc3NhZ2VPcHRpb25zKFxuICAgICAgICAgICAgbG9nZ2VkSW5Vc2VyLFxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgIHRoZW1lLFxuICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbzpcbiAgICAgICAgICBfb3B0aW9uTGlzdCA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFZpZGVvTWVzc2FnZU9wdGlvbnMoXG4gICAgICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgICAgdGhlbWUsXG4gICAgICAgICAgICBncm91cFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmdyb3VwTWVtYmVyOlxuICAgICAgICAgIF9vcHRpb25MaXN0ID0gW107XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRGaWxlTWVzc2FnZU9wdGlvbnMoXG4gICAgICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgICAgdGhlbWUsXG4gICAgICAgICAgICBncm91cFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvOlxuICAgICAgICAgIF9vcHRpb25MaXN0ID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QXVkaW9NZXNzYWdlT3B0aW9ucyhcbiAgICAgICAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgICAgICB0aGVtZSxcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbWVzc2FnZU9iamVjdC5nZXRDYXRlZ29yeSgpID09XG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuY3VzdG9tIHx8XG4gICAgICBtZXNzYWdlT2JqZWN0LmdldENhdGVnb3J5KCkgPT1cbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5pbnRlcmFjdGl2ZVxuICAgICkge1xuICAgICAgX29wdGlvbkxpc3QgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRDb21tb25PcHRpb25zKFxuICAgICAgICBsb2dnZWRJblVzZXIsXG4gICAgICAgIG1lc3NhZ2VPYmplY3QsXG4gICAgICAgIHRoZW1lLFxuICAgICAgICBncm91cFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIF9vcHRpb25MaXN0O1xuICB9XG4gIGdldENvbW1vbk9wdGlvbnMoXG4gICAgbG9nZ2VkSW5Vc2VyOiBDb21ldENoYXQuVXNlcixcbiAgICBtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIGdyb3VwPzogQ29tZXRDaGF0Lkdyb3VwXG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+IHtcbiAgICBsZXQgaXNTZW50QnlNZTogYm9vbGVhbiA9IHRoaXMuaXNTZW50QnlNZShsb2dnZWRJblVzZXIsIG1lc3NhZ2VPYmplY3QpO1xuICAgIGxldCBpc1BhcnRpY2lwYW50OiBib29sZWFuID0gZmFsc2U7XG4gICAgaWYgKGdyb3VwPy5nZXRTY29wZSgpID09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyU2NvcGUucGFydGljaXBhbnQpXG4gICAgICBpc1BhcnRpY2lwYW50ID0gdHJ1ZTtcbiAgICBsZXQgbWVzc2FnZU9wdGlvbkxpc3Q6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VPcHRpb24+ID0gW107XG4gICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldFJlYWN0aW9uT3B0aW9uKHRoZW1lKSk7XG4gICAgaWYgKCFtZXNzYWdlT2JqZWN0Py5nZXRQYXJlbnRNZXNzYWdlSWQoKSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldFJlcGx5SW5UaHJlYWRPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgaWYgKGlzU2VudEJ5TWUpIHtcbiAgICAgIG1lc3NhZ2VPcHRpb25MaXN0LnB1c2godGhpcy5nZXRNZXNzYWdlSW5mb09wdGlvbih0aGVtZSkpO1xuICAgIH1cbiAgICBpZiAoaXNTZW50QnlNZSB8fCAoIWlzUGFydGljaXBhbnQgJiYgZ3JvdXApKVxuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldERlbGV0ZU9wdGlvbih0aGVtZSkpO1xuICAgIGlmIChncm91cCAmJiAhaXNTZW50QnlNZSkge1xuICAgICAgbWVzc2FnZU9wdGlvbkxpc3QucHVzaCh0aGlzLmdldE1lc3NhZ2VQcml2YXRlbHlPcHRpb24odGhlbWUpKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2VPcHRpb25MaXN0O1xuICB9XG4gIGdldEFsbE1lc3NhZ2VUeXBlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gW1xuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnRleHQsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW8sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5ncm91cE1lbWJlcixcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5mb3JtLFxuICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmNhcmQsXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuc2NoZWR1bGVyLFxuICAgIF07XG4gIH1cbiAgYWRkTGlzdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBcIjxNZXNzYWdlIFV0aWxzPlwiO1xuICB9XG4gIGdldEFsbE1lc3NhZ2VDYXRlZ29yaWVzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBbXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkubWVzc2FnZSxcbiAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VDYXRlZ29yeS5hY3Rpb24sXG4gICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlQ2F0ZWdvcnkuaW50ZXJhY3RpdmUsXG4gICAgXTtcbiAgfVxuICBnZXRBdXhpbGlhcnlPcHRpb25zKFxuICAgIGlkOiBDb21wb3NlcklkLFxuICAgIHVzZXI/OiBDb21ldENoYXQuVXNlcixcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cFxuICApOiBhbnkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwibWVzc2FnZVV0aWxzXCI7XG4gIH1cbiAgZ2V0QWN0aW9uTWVzc2FnZShtZXNzYWdlOiBDb21ldENoYXQuQWN0aW9uKTogc3RyaW5nIHtcbiAgICB0cnkge1xuICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuQWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IG1lc3NhZ2UuZ2V0QWN0aW9uKCk7XG4gICAgICAgIGNvbnN0IGFjdGlvbkJ5ID0gbWVzc2FnZS5nZXRBY3Rpb25CeSgpO1xuICAgICAgICBjb25zdCBhY3Rpb25PbiA9IG1lc3NhZ2UuZ2V0QWN0aW9uT24oKTtcblxuICAgICAgICBjb25zdCBieVN0cmluZyA9IChhY3Rpb25CeSBhcyBDb21ldENoYXQuVXNlcikuZ2V0TmFtZSgpO1xuICAgICAgICBjb25zdCBmb3JTdHJpbmcgPVxuICAgICAgICAgIGFjdGlvbiA9PT0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uSk9JTkVEIHx8XG4gICAgICAgICAgICBhY3Rpb24gPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkxFRlRcbiAgICAgICAgICAgID8gXCJcIlxuICAgICAgICAgICAgOiAoYWN0aW9uT24gYXMgQ29tZXRDaGF0LlVzZXIpLmdldE5hbWUoKTtcblxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uQURERUQ6XG4gICAgICAgICAgICByZXR1cm4gYCR7YnlTdHJpbmd9ICR7bG9jYWxpemUoXCJBRERFRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkpPSU5FRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkpPSU5FRFwiKX1gO1xuICAgICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuZ3JvdXBNZW1iZXJBY3Rpb24uTEVGVDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkxFRlRcIil9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLktJQ0tFRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIktJQ0tFRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLkJBTk5FRDpcbiAgICAgICAgICAgIHJldHVybiBgJHtieVN0cmluZ30gJHtsb2NhbGl6ZShcIkJBTk5FRFwiKX0gJHtmb3JTdHJpbmd9YDtcbiAgICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLmdyb3VwTWVtYmVyQWN0aW9uLlVOQkFOTkVEOlxuICAgICAgICAgICAgcmV0dXJuIGAke2J5U3RyaW5nfSAke2xvY2FsaXplKFwiVU5CQU5ORURcIil9ICR7Zm9yU3RyaW5nfWA7XG4gICAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5ncm91cE1lbWJlckFjdGlvbi5TQ09QRV9DSEFOR0U6XG4gICAgICAgICAgICByZXR1cm4gYCR7YnlTdHJpbmd9ICR7bG9jYWxpemUoXG4gICAgICAgICAgICAgIFwiTUFERVwiXG4gICAgICAgICAgICApfSAke2ZvclN0cmluZ30gJHttZXNzYWdlLmdldE5ld1Njb3BlKCl9YDtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIGltYWdlQXR0YWNobWVudE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2UsXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJBVFRBQ0hfSU1BR0VcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9waG90b2xpYnJhcnkuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gIH1cbiAgdmlkZW9BdHRhY2htZW50T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbyxcbiAgICAgIHRpdGxlOiBsb2NhbGl6ZShcIkFUVEFDSF9WSURFT1wiKSxcbiAgICAgIGljb25VUkw6IFwiYXNzZXRzL3ZpZGVvLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICB9XG4gIGF1ZGlvQXR0YWNobWVudE9wdGlvbih0aGVtZTogQ29tZXRDaGF0VGhlbWUpOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24ge1xuICAgIHJldHVybiBuZXcgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKHtcbiAgICAgIGlkOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW8sXG4gICAgICB0aXRsZTogbG9jYWxpemUoXCJBVFRBQ0hfQVVESU9cIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9hdWRpby1maWxlLnN2Z1wiLFxuICAgICAgb25DbGljazogbnVsbCxcbiAgICAgIGljb25UaW50OiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgIH0pO1xuICB9XG4gIGZpbGVBdHRhY2htZW50T3B0aW9uKHRoZW1lOiBDb21ldENoYXRUaGVtZSk6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24oe1xuICAgICAgaWQ6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlLFxuICAgICAgdGl0bGU6IGxvY2FsaXplKFwiQVRUQUNIX0ZJTEVcIiksXG4gICAgICBpY29uVVJMOiBcImFzc2V0cy9hdHRhY2htZW50LWZpbGUuc3ZnXCIsXG4gICAgICBvbkNsaWNrOiBudWxsLFxuICAgICAgaWNvblRpbnQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgfSk7XG4gIH1cbiAgZ2V0QXR0YWNobWVudE9wdGlvbnMoXG4gICAgdGhlbWU6IENvbWV0Q2hhdFRoZW1lLFxuICAgIHVzZXI/OiBDb21ldENoYXQuVXNlcixcbiAgICBncm91cD86IENvbWV0Q2hhdC5Hcm91cCxcbiAgICBpZD86IENvbXBvc2VySWRcbiAgKTogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uW10ge1xuICAgIGxldCBhY3Rpb25zOiBBcnJheTxDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24+ID0gW1xuICAgICAgdGhpcy5pbWFnZUF0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy52aWRlb0F0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy5hdWRpb0F0dGFjaG1lbnRPcHRpb24odGhlbWUpLFxuICAgICAgdGhpcy5maWxlQXR0YWNobWVudE9wdGlvbih0aGVtZSksXG4gICAgXTtcbiAgICByZXR1cm4gYWN0aW9ucztcbiAgfVxuXG4gIGdldExhc3RDb252ZXJzYXRpb25NZXNzYWdlKFxuICAgIGNvbnZlcnNhdGlvbjogQ29tZXRDaGF0LkNvbnZlcnNhdGlvbixcbiAgICBsb2dnZWRJblVzZXI6IENvbWV0Q2hhdC5Vc2VyLFxuICAgIGFkZGl0aW9uYWxDb25maWd1cmF0aW9uczogYW55XG4gICk6IHN0cmluZyB7XG4gICAgbGV0IGNvbmZpZyA9IHtcbiAgICAgIC4uLmFkZGl0aW9uYWxDb25maWd1cmF0aW9ucyxcbiAgICAgIHRleHRGb3JtYXR0ZXJzOlxuICAgICAgICBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnM/LnRleHRGb3JtYXR0ZXJzICYmXG4gICAgICAgICAgYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zPy50ZXh0Rm9ybWF0dGVycy5sZW5ndGhcbiAgICAgICAgICA/IFsuLi5hZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMudGV4dEZvcm1hdHRlcnNdXG4gICAgICAgICAgOiBbdGhpcy5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoeyB0aGVtZTogYWRkaXRpb25hbENvbmZpZ3VyYXRpb25zLnRoZW1lLCBkaXNhYmxlTWVudGlvbnM6IGFkZGl0aW9uYWxDb25maWd1cmF0aW9ucy5kaXNhYmxlTWVudGlvbnMgfSldLFxuICAgIH07XG4gICAgbGV0IG1lc3NhZ2UgPSBDb252ZXJzYXRpb25VdGlscy5nZXRMYXN0Q29udmVyc2F0aW9uTWVzc2FnZShcbiAgICAgIGNvbnZlcnNhdGlvbixcbiAgICAgIGxvZ2dlZEluVXNlcixcbiAgICAgIGNvbmZpZ1xuICAgICk7XG4gICAgbGV0IG1lc3NhZ2VPYmplY3QgPSBjb252ZXJzYXRpb24/LmdldExhc3RNZXNzYWdlKCk7XG4gICAgaWYgKG1lc3NhZ2VPYmplY3QpIHtcbiAgICAgIGxldCB0ZXh0Rm9ybWF0dGVyczogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBjb25maWcudGV4dEZvcm1hdHRlcnM7XG4gICAgICBpZiAoY29uZmlnICYmICFjb25maWcuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Rm9ybWF0dGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0ZXh0Rm9ybWF0dGVyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSB0ZXh0Rm9ybWF0dGVyc1tcbiAgICAgICAgICAgICAgaVxuICAgICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICAgIG1lbnRpb25zVGV4dEZvcm1hdHRlci5zZXRNZXNzYWdlKG1lc3NhZ2VPYmplY3QpO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2VPYmplY3QuZ2V0TWVudGlvbmVkVXNlcnMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5nZXRNZW50aW9uZWRVc2VycygpXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0TG9nZ2VkSW5Vc2VyKFxuICAgICAgICAgICAgICBDb21ldENoYXRVSUtpdExvZ2luTGlzdGVuZXIuZ2V0TG9nZ2VkSW5Vc2VyKCkhXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWVudGlvbnNUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtZW50aW9uc1RleHRGb3JtYXR0ZXIpIHtcbiAgICAgICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPVxuICAgICAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgICAgLi4uY29uZmlnLFxuICAgICAgICAgICAgICBhbGlnbm1lbnQ6IG51bGwsXG4gICAgICAgICAgICAgIHRoZW1lOiBhZGRpdGlvbmFsQ29uZmlndXJhdGlvbnMudGhlbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0ZXh0Rm9ybWF0dGVycy5wdXNoKG1lbnRpb25zVGV4dEZvcm1hdHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBtZXNzYWdlT2JqZWN0ICYmXG4gICAgICAgIG1lc3NhZ2VPYmplY3QgaW5zdGFuY2VvZiBDb21ldENoYXQuVGV4dE1lc3NhZ2VcbiAgICAgICkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRGb3JtYXR0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IHRleHRGb3JtYXR0ZXJzW2ldLmdldEZvcm1hdHRlZFRleHQobWVzc2FnZSwgeyBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudC5jb252ZXJzYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBzdHlsZWQgQCBmb3IgZXZlcnkgbWVudGlvbiBpbiB0aGUgdGV4dCBieSBtYXRjaGluZyB1aWRcbiAgICpcbiAgICogQHBhcmFtIHtDb21ldENoYXQuVGV4dE1lc3NhZ2V9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN1YnRpdGxlXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgZ2V0TWVudGlvbnNGb3JtYXR0ZWRUZXh0KFxuICAgIG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSxcbiAgICBzdWJ0aXRsZTogc3RyaW5nLFxuICAgIG1lbnRpb25zRm9ybWF0dGVyUGFyYW1zOiB7XG4gICAgICBtZW50aW9uc1RhcmdldEVsZW1lbnQ6IE1lbnRpb25zVGFyZ2V0RWxlbWVudDtcbiAgICAgIHRoZW1lOiBDb21ldENoYXRUaGVtZTtcbiAgICB9XG4gICkge1xuICAgIGNvbnN0IHJlZ2V4ID0gLzxAdWlkOiguKj8pPi9nO1xuICAgIGxldCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2UuZ2V0VGV4dCgpO1xuICAgIGxldCBtZXNzYWdlVGV4dFRtcDogc3RyaW5nID0gc3VidGl0bGU7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzOiBBcnJheTxDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cE1lbWJlcj4gPSBbXTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBjb21ldENoYXRVc2Vycy5wdXNoKHVzZXIpO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgbGV0IG1lbnRpb25zRm9ybWF0dGVyID0gdGhpcy5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoXG4gICAgICBtZW50aW9uc0Zvcm1hdHRlclBhcmFtc1xuICAgICk7XG4gICAgbWVudGlvbnNGb3JtYXR0ZXIuc2V0Q2xhc3NlcyhbXCJjYy1tZW50aW9uc1wiXSk7XG4gICAgbWVudGlvbnNGb3JtYXR0ZXIuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhjb21ldENoYXRVc2Vycyk7XG4gICAgbWVzc2FnZVRleHRUbXAgPSBtZW50aW9uc0Zvcm1hdHRlci5nZXRGb3JtYXR0ZWRUZXh0KFxuICAgICAgbWVzc2FnZVRleHRUbXAsXG4gICAgICBtZW50aW9uc0Zvcm1hdHRlclBhcmFtc1xuICAgICkgYXMgc3RyaW5nO1xuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIGdldEFJT3B0aW9ucyhcbiAgICB0aGVtZTogQ29tZXRDaGF0VGhlbWUsXG4gICAgaWQ/OiBNYXA8U3RyaW5nLCBhbnk+XG4gICk6IEFycmF5PENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB8IENvbWV0Q2hhdEFjdGlvbnNWaWV3PiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0QWxsVGV4dEZvcm1hdHRlcnMoZm9ybWF0dGVyUGFyYW1zOiBhbnkpOiBDb21ldENoYXRUZXh0Rm9ybWF0dGVyW10ge1xuICAgIGxldCBmb3JtYXR0ZXJzID0gW107XG4gICAgY29uc3QgbWVudGlvbnNGb3JtYXR0ZXIgPSBmb3JtYXR0ZXJQYXJhbXMuZGlzYWJsZU1lbnRpb25zID8gbnVsbCA6IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lbnRpb25zVGV4dEZvcm1hdHRlcihcbiAgICAgIGZvcm1hdHRlclBhcmFtc1xuICAgICk7XG4gICAgY29uc3QgdXJsVGV4dEZvcm1hdHRlciA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldFVybFRleHRGb3JtYXR0ZXIoZm9ybWF0dGVyUGFyYW1zKTtcbiAgICBpZiAobWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgIGZvcm1hdHRlcnMucHVzaChtZW50aW9uc0Zvcm1hdHRlcik7XG4gICAgfVxuICAgIGlmICh1cmxUZXh0Rm9ybWF0dGVyKSB7XG4gICAgICBmb3JtYXR0ZXJzLnB1c2godXJsVGV4dEZvcm1hdHRlcik7XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXR0ZXJzO1xuICB9XG5cbiAgZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHBhcmFtczogYW55KTogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIge1xuICAgIGxldCBtZW50aW9uc1RleHRGb3JtYXR0ZXIgPSBuZXcgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIoKTtcbiAgICBpZiAocGFyYW1zICYmIHBhcmFtcy50aGVtZSkge1xuICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldENvbXBvc2VyTWVudGlvblN0eWxlKFxuICAgICAgICBuZXcgVXNlck1lbnRpb25TdHlsZSh7XG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIG1lbnRpb25UZXh0QmFja2dyb3VuZDogXCJcIixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0Q29udmVyc2F0aW9uTWVudGlvblN0eWxlKFxuICAgICAgICBuZXcgVXNlck1lbnRpb25TdHlsZSh7XG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgICAgIG1lbnRpb25UZXh0QmFja2dyb3VuZDogXCJcIixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBtZW50aW9uc1RleHRGb3JtYXR0ZXIuc2V0UmlnaHRCdWJibGVNZW50aW9uU3R5bGUoXG4gICAgICAgIG5ldyBVc2VyTWVudGlvblN0eWxlKHtcbiAgICAgICAgICBsb2dnZWRJblVzZXJUZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRUZXJ0aWFyeSgpLFxuICAgICAgICAgIGxvZ2dlZEluVXNlclRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICAgIG1lbnRpb25UZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbWVudGlvblRleHRDb2xvcjogcGFyYW1zLnRoZW1lLnBhbGV0dGUuZ2V0VGVydGlhcnkoKSxcbiAgICAgICAgICBtZW50aW9uVGV4dEJhY2tncm91bmQ6IFwiXCIsXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgbWVudGlvbnNUZXh0Rm9ybWF0dGVyLnNldExlZnRCdWJibGVNZW50aW9uU3R5bGUoXG4gICAgICAgIG5ldyBVc2VyTWVudGlvblN0eWxlKHtcbiAgICAgICAgICBsb2dnZWRJblVzZXJUZXh0Rm9udDogZm9udEhlbHBlcihwYXJhbXMudGhlbWUudHlwb2dyYXBoeS50ZXh0MyksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgICAgbG9nZ2VkSW5Vc2VyVGV4dEJhY2tncm91bmQ6IFwiXCIsXG4gICAgICAgICAgbWVudGlvblRleHRGb250OiBmb250SGVscGVyKHBhcmFtcy50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgICAgICBtZW50aW9uVGV4dENvbG9yOiBwYXJhbXMudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICAgICAgbWVudGlvblRleHRCYWNrZ3JvdW5kOiBcIlwiLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lbnRpb25zVGV4dEZvcm1hdHRlcjtcbiAgfVxuXG4gIGdldFVybFRleHRGb3JtYXR0ZXIocGFyYW1zOiBhbnkgPSB7fSk6IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIge1xuICAgIGxldCB1cmxUZXh0Rm9ybWF0dGVyID0gbmV3IENvbWV0Q2hhdFVybHNGb3JtYXR0ZXIoW1xuICAgICAgLyhodHRwcz86XFwvXFwvW15cXHNdKykvZyxcbiAgICBdKTtcbiAgICBpZiAocGFyYW1zLmFsaWdubWVudCA9PSBNZXNzYWdlQnViYmxlQWxpZ25tZW50LmxlZnQpIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIuc2V0U3R5bGUoe1xuICAgICAgICBmb3JtYXR0ZWRUZXh0Q29sb3I6IHBhcmFtcy50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgZm9ybWF0dGVkVGV4dEZvbnQ6IGZvbnRIZWxwZXIocGFyYW1zLnRoZW1lLnR5cG9ncmFwaHkudGV4dDMpLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybFRleHRGb3JtYXR0ZXIuc2V0U3R5bGUoe1xuICAgICAgICBmb3JtYXR0ZWRUZXh0Q29sb3I6IHBhcmFtcy50aGVtZS5wYWxldHRlLmdldFRlcnRpYXJ5KCksXG4gICAgICAgIGZvcm1hdHRlZFRleHRGb250OiBmb250SGVscGVyKHBhcmFtcy50aGVtZS50eXBvZ3JhcGh5LnRleHQzKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdXJsVGV4dEZvcm1hdHRlcjtcbiAgfVxufVxuZXhwb3J0IHR5cGUgQ29tcG9zZXJJZCA9IHtcbiAgcGFyZW50TWVzc2FnZUlkOiBudW1iZXIgfCBudWxsO1xuICB1c2VyOiBzdHJpbmcgfCBudWxsO1xuICBncm91cDogc3RyaW5nIHwgbnVsbDtcbn07XG4iXX0=