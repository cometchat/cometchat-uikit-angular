
/**
 * @class ConversationWithMessagesConfiguration
 * @param {Boolean} hideLayoutMode
 * @param {string} title
 * @param {string} layoutModeIconURL
 * @param {string} layoutMode
 */

export class ActionSheetConfiguration {

    hideLayoutMode: boolean = false;
    title: string = "Add to Chat";
    layoutModeIconURL: string = "assets/resources/Grid-layout.svg";
    layoutMode: string = layoutType.list;

    constructor({
        hideLayoutMode = false,
        title = "Add to Chat",
        layoutModeIconURL = "assets/resources/Grid-layout.svg",
        layoutMode = layoutType.list,

    }) {
        this.hideLayoutMode = hideLayoutMode;
        this.title = title;
        this.layoutModeIconURL = layoutModeIconURL;
        this.layoutMode = layoutMode;


    }
}
const layoutType: { list: string, grid: string } = Object.freeze({
    list: "list",
    grid: "grid"
});