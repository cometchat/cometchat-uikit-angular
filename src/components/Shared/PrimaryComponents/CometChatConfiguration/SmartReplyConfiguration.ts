/**
 * @class SmartReplyConfiguration
 * @param {callback} onClick
 */
export class SmartReplyConfiguration {
    onClick!: () => void;
    constructor({ onClick = () => { } }) {
        this.onClick = onClick

    }
}
