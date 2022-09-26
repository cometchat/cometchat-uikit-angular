/**
 * @class ConversationWithMessagesConfiguration
 * @param {boolean} hideSearch
 * @param {callback} onClick
 */
export class EmojiKeyboardConfiguration {
    hideSearch: boolean = true;
    onClick!: (emoji: string) => void;
    constructor({
        hideSearch = true,
        onClick = (emoji: string) => "",

    }) {
        this.hideSearch = hideSearch;
        this.onClick = onClick;


    }
}