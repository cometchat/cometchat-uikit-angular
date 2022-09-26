/**
 * @class CometChatEmoji
 * @description CometChatEmoji class is used for defining the emoji.
 *
 * @param {String} char
 * @param {[]} keywords
 */

 class CometChatEmoji {
    char:string = "";
    keywords:any = [];
  
    constructor({ char = "", keywords = [] }) {
      this.char = char;
      this.keywords = keywords;
    }
  }
  
  export { CometChatEmoji };
  