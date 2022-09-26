/**
 * @class CometChatEmojiCategory
 * @description CometChatEmojiCategory class is used for defining the emoji categories.
 *
 * @param {String} id
 * @param {String} symbolURL
 * @param {String} name
 * @param {null | object[]} emojies
 */
export class CometChatEmojiCategory {
    id: string;
    symbolURL: string;
    name: string;
    emojies: null | object[];
    constructor({
        id = "",
        symbolURL = "",
        name = "",
        emojies = null,
    }) {
        this.id = id;
        this.symbolURL = symbolURL;
        this.name = name;
        this.emojies = emojies;
    }
}


