import { stickerEnums } from "../../Constants/UIKitConstants";
/**
 * @class StickerKeyboardConfiguration
 * @param {string} errorText
 * @param {string} loadingText
 * @param {string} emptyText
 * @param {callback} onClick
 */
export class StickerKeyboardConfiguration {
    emptyText: string = stickerEnums.no_stickers_found;
    loadingText: string = stickerEnums.loading_message;
    errorText: string = "Something went wrong";
    onClick!: any;
    constructor({
        emptyText = stickerEnums.no_stickers_found,
        loadingText = stickerEnums.loading_message,
        errorText = "Something went wrong",
        onClick = null,
    }) {
        this.emptyText = emptyText
        this.loadingText = loadingText
        this.errorText = errorText
        this.onClick = onClick
    }
}