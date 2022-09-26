
/**
 * @class MessagePreviewConfiguration
 * @param {string} messagePreviewTitle
 * @param {string} messagePreviewSubtitle
 * @param {callback} onCloseClick
 * @param {boolean} showMessagePreview
 * @param {string} messagePreviewCloseButtonIconURL
 */
export class MessagePreviewConfiguration {
   messagePreviewTitle = "Edit Message";
   messagePreviewSubtitle = "";
   messagePreviewCloseButtonIconURL = "assets/resources/close.svg";
   onCloseClick!: any
   showMessagePreview: boolean = false;
   constructor({
      messagePreviewTitle = "Edit Message",
      messagePreviewSubtitle = "",
      messagePreviewCloseButtonIconURL = "assets/resources/close.svg",
      onCloseClick = null,
      showMessagePreview = false,
   }) {
      this.messagePreviewTitle = messagePreviewTitle;
      this.messagePreviewSubtitle = messagePreviewSubtitle;
      this.messagePreviewCloseButtonIconURL = messagePreviewCloseButtonIconURL;
      this.onCloseClick = onCloseClick;
      this.showMessagePreview = showMessagePreview
   }

}