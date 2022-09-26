import { ConversationListItemConfiguration } from "./ConversationListItemConfiguration";

/**
 * @class ConversationWithMessagesConfiguration
 * @param {boolean} hideError
 * @param {string} loadingIconURL
 * @param {number} limit
 * @param {string} userAndGroupTags
 * @param {[]string} tags
 * @param {any} customView
 */
export class ConversationListConfiguration {
	hideError: boolean = false;
	loadingIconURL = "assets/resources/Spinner.svg";
	limit = 30;
	userAndGroupTags = false;
	tags = [];
	customView = null;
	conversationListItemConfiguration : ConversationListItemConfiguration = new ConversationListItemConfiguration({})
	constructor(
		{
			hideError = false,
	
			loadingIconURL = "assets/resources/Spinner.svg",
			limit = 30,
			userAndGroupTags = false,
			tags = [],
			customView = null,
			conversationListItemConfiguration = new ConversationListItemConfiguration({})
		}
	) {
		this.hideError = hideError;
		this.loadingIconURL = loadingIconURL,
			this.limit = limit;
		this.userAndGroupTags = userAndGroupTags;
		this.tags = tags;
		this.customView = customView;
		this.conversationListItemConfiguration=conversationListItemConfiguration

	}

}
