import { CometChatMessageTemplate } from "../../../Messages/CometChatMessageTemplate/cometchat-message-template";
import { MessageComposerConfiguration } from "./MessageComposerConfiguration";
import { MessageHeaderConfiguration } from "./MessageHeaderConfiguration";
import { MessageListConfiguration } from "./MessageListConfiguration";
/**
 * @class MessagesConfiguration
 * @param {boolean} hideMessageComposer
 * @param {array} messageTypes
 * @param {string} customIncomingMessageSound
 * @param {string} customOutgoingMessageSound
 * @param {boolean} enableSoundForMessages
 * @param {boolean} enableSoundForCalls
 * @param {boolean} enableTypingIndicator
 * @param {object} messageListConfiguration
 * @param {object} messageHeaderConfiguration
 * @param {object} messageComposerConfiguration
 */
class MessagesConfiguration {
    hideMessageComposer: boolean = false; //hide show message composer

    messageTypes: CometChatMessageTemplate[] = [];
    customIncomingMessageSound!: string;
    customOutgoingMessageSound!: string;
    enableSoundForMessages!: boolean;
    enableSoundForCalls!: boolean;
    enableTypingIndicator!: boolean;
    messageListConfiguration = new MessageListConfiguration({})
    messageHeaderConfiguration = new MessageHeaderConfiguration({})
    messageComposerConfiguration = new MessageComposerConfiguration({})
    constructor(
        {
            hideMessageComposer = false,
            messageTypes = [],
            customIncomingMessageSound = "",
            customOutgoingMessageSound = "",
            enableSoundForMessages = true,
            enableSoundForCalls = true,
            enableTypingIndicator = true,

            messageListConfiguration = new MessageListConfiguration({}),
            messageHeaderConfiguration = new MessageHeaderConfiguration({}),
            messageComposerConfiguration = new MessageComposerConfiguration({}),

        }
    ) {
        this.hideMessageComposer = hideMessageComposer; //hide show message composer
        this.messageTypes = messageTypes;
        this.customIncomingMessageSound = customIncomingMessageSound;
        this.customOutgoingMessageSound = customOutgoingMessageSound;
        this.enableSoundForMessages = enableSoundForMessages;
        this.enableSoundForCalls = enableSoundForCalls;
        this.enableTypingIndicator = enableTypingIndicator;
        this.messageListConfiguration = messageListConfiguration
        this.messageHeaderConfiguration = messageHeaderConfiguration
        this.messageComposerConfiguration = messageComposerConfiguration
    }

}
export { MessagesConfiguration };