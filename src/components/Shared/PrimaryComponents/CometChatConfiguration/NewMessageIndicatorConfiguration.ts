/**
 * @class NewMessageIndicatorConfiguration
 * @param {string} text
 * @param {string} icon
 * @param {callback} onClick
 */
export class NewMessageIndicatorConfiguration {
    text: string = ""; //text to show on screen
    icon: string = "";
    onClick: any = null; //callback on click of screen
    constructor({
        text = "",
        icon = "",
        onClick = null


    }) {
        this.text = text;
        this.icon = icon;
        this.onClick = onClick;

    }
}
