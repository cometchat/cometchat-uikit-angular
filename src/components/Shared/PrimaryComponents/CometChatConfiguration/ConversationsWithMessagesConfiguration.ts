import {
	ConversationsConfiguration,
	MessagesConfiguration
} from "./";

/**
 * @class ConversationWithMessagesConfiguration
 * @param {Boolean} isMobile
 * @param {Object} conversationsConfiguration
 * @param {Object} messagesConfiguration
 */
class ConversationWithMessagesConfiguration {
	isMobile = false
	conversationsConfiguration = new ConversationsConfiguration({})
	messagesConfiguration = new MessagesConfiguration({})
	constructor(
		{
			isMobile = false,
			conversationsConfiguration = new ConversationsConfiguration({}),
			messagesConfiguration = new MessagesConfiguration({}),
		}
	) {
		this.isMobile = isMobile;
		conversationsConfiguration = conversationsConfiguration;
		messagesConfiguration = messagesConfiguration;
	}
}

export { ConversationWithMessagesConfiguration };