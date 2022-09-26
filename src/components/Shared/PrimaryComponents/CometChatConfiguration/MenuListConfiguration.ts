/**
 * @class MenuListConfiguration
 * @param {string} moreIconURL
 * @param {number} mainMenuLimit
 * @param {boolean} isOpen

 */
export class MenuListConfiguration {

    moreIconURL: string = "assets/resources/moreicon.svg"; //Image URL for more icon
    mainMenuLimit: number = 2;
    isOpen: boolean = false;
    constructor({
        moreIconURL = "assets/resources/moreicon.svg",
        mainMenuLimit = 2,

    }) {
        this.moreIconURL = moreIconURL;
        this.mainMenuLimit = mainMenuLimit;

    }
}