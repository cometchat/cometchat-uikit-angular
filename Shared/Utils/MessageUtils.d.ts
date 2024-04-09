import { CometChatMessageOption, MessageBubbleAlignment, CometChatMessageTemplate, CometChatMessageComposerAction, CometChatTheme, CometChatActionsView, MentionsTargetElement } from "@cometchat/uikit-resources";
import { CometChatMentionsFormatter, CometChatTextFormatter, CometChatUrlsFormatter } from "@cometchat/uikit-shared";
import { DataSource } from "../Framework/DataSource";
export declare class MessageUtils implements DataSource {
    /**
   * Creates an option to edit message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getEditOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Creates an option to react to a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getReactionOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Creates an option to get info about a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getMessageInfoOption(theme: CometChatTheme): CometChatMessageOption;
    /**
    * Creates an option to send a private message.
    * @param {CometChatTheme} theme - The theme object.
    * @return {CometChatMessageOption} - Returns a new message option.
    */
    getMessagePrivatelyOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Creates an option to delete a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getDeleteOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Creates an option to reply to a message in a thread.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getReplyInThreadOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Creates an option to copy a message.
   * @param {CometChatTheme} theme - The theme object.
   * @return {CometChatMessageOption} - Returns a new message option.
   */
    getCopyOption(theme: CometChatTheme): CometChatMessageOption;
    /**
   * Checks if a message is sent by current logged in user.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} message - The message to check.
   * @return {boolean} - Returns true if message is sent by current logged in user, otherwise false.
   */
    isSentByMe(loggedInUser: CometChat.User, message: CometChat.BaseMessage): boolean;
    /**
   * Fetches options for text messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    /**
   * Fetches options for image messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    /**
   * Fetches options for video messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    /**
   * Fetches options for audio messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    /**
   * Fetches options for file messages.
   * @param {CometChat.User} loggedInUser - The current logged in user.
   * @param {CometChat.BaseMessage} messageObject - The message object.
   * @param {CometChatTheme} theme - The theme object.
   * @param {CometChat.Group} group - (Optional) The group object.
   * @return {Array<CometChatMessageOption>} - Returns an array of message options.
   */
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    getBottomView(_messageObject: CometChat.BaseMessage, _alignment: MessageBubbleAlignment): null;
    getSchedulerMessageTemplate(): CometChatMessageTemplate;
    getTextMessageTemplate(): CometChatMessageTemplate;
    getAudioMessageTemplate(): CometChatMessageTemplate;
    getVideoMessageTemplate(): CometChatMessageTemplate;
    getImageMessageTemplate(): CometChatMessageTemplate;
    getGroupActionTemplate(): CometChatMessageTemplate;
    getFileMessageTemplate(): CometChatMessageTemplate;
    getFormMessageTemplate(): CometChatMessageTemplate;
    getCardMessageTemplate(): CometChatMessageTemplate;
    getAllMessageTemplates(): Array<CometChatMessageTemplate>;
    getMessageTemplate(messageType: string, messageCategory: string): CometChatMessageTemplate | null;
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption>;
    getAllMessageTypes(): Array<string>;
    addList(): string;
    getAllMessageCategories(): Array<string>;
    getAuxiliaryOptions(id: ComposerId, user?: CometChat.User, group?: CometChat.Group): any;
    getId(): string;
    getActionMessage(message: CometChat.Action): string;
    imageAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    videoAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    audioAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    fileAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction;
    getAttachmentOptions(theme: CometChatTheme, user?: CometChat.User, group?: CometChat.Group, id?: ComposerId): CometChatMessageComposerAction[];
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations: any): string;
    /**
     * Adds styled @ for every mention in the text by matching uid
     *
     * @param {CometChat.TextMessage} message
     * @param {string} subtitle
     * @returns {void}
     */
    getMentionsFormattedText(message: CometChat.TextMessage, subtitle: string, mentionsFormatterParams: {
        mentionsTargetElement: MentionsTargetElement;
        theme: CometChatTheme;
    }): string;
    getAIOptions(theme: CometChatTheme, id?: Map<String, any>): Array<CometChatMessageComposerAction | CometChatActionsView>;
    getAllTextFormatters(formatterParams: any): CometChatTextFormatter[];
    getMentionsTextFormatter(params: any): CometChatMentionsFormatter;
    getUrlTextFormatter(params?: any): CometChatUrlsFormatter;
}
export declare type ComposerId = {
    parentMessageId: number | null;
    user: string | null;
    group: string | null;
};
