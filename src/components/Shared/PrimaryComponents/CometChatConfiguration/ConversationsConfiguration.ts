import { ConversationListConfiguration } from "./";
/**
 * @class ConversationWithMessagesConfiguration
 * @param {Object} conversationListConfiguration
 * @param {string} searchPlaceholder
 * @param {string} searchIconURL
 * @param {boolean} hideSearch
 * @param {string} backButtonIconURL
 * @param {boolean} showBackButton
 */
export class ConversationsConfiguration {
    searchPlaceholder:string = "assets/resources/Spinner.svg";
    searchIconURL:string = "assets/resources/search.svg";
    backButtonIconURL:string = "assets/resources/backbutton.svg";
    hideSearch:boolean = true;
    showBackButton:boolean = false;
    conversationListConfiguration = new ConversationListConfiguration({});
    constructor({
        conversationListConfiguration = new ConversationListConfiguration({}),
        onClickBackButton = null,

    }) {
        this.conversationListConfiguration = conversationListConfiguration;

    }

}