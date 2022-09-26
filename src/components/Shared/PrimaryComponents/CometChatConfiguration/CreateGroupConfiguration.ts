/**
 * @class ConversationWithMessagesConfiguration
 * @param {callback} onClose
 * @param {boolean} hideCloseButton
 * @param {callback} onCreateGroup
 * @param {string} closeButtonpIconURL
 */

import { createGroupStyle } from "../../../Groups/CometChatCreateGroup/interface";


export class CreateGroupConfiguration {
 onClose:any = null;
 hideCloseButton:any= false;
 onCreateGroup:any = null;
 closeButtonIconURL:string="assets/resources/close2x.svg";
 style!: createGroupStyle;
 constructor({
    onClose = null,
    hideCloseButton= false,
    onCreateGroup = null,
    closeButtonpIconURL="assets/resources/close2x.svg",
    style = {
      width: "100%",
      height: "100%",
      background: "rgb(255, 255, 255)",
      border: "none",
      borderRadius: "8px",
      boxShadow:"rgba(20, 20, 20, 0.2) 0px 16px 32px 0px",
      groupTypeTextFont: "500 13px Inter",
      groupTypeBorder:"1px solid rgb(178 178 178 / 60%)",
      groupTypeTextColor: "black",
      groupTypeTextBackground:"transparent",
      groupTypeBackground:"rgba(20, 20, 20, 0.08)",
      groupTypeTextActiveBackground:"rgb(255, 255, 255)",
      groupTypeTextActiveBoxShadow:"rgba(20, 20, 20, 0.12) 0 3px 8px 0",
      groupTypeTextActiveBorderRadius:"8px",
      groupTypeTextBoxShadow:"none",
      groupTypeTextBorderRadius:"0",
      closeIconTint:"rgb(51, 153, 255)",
      titleTextFont: "700 22px Inter",
      titleTextColor: "rgb(20, 20, 20)",
      errorTextFont: "500 15px Inter",
      errorTextBackground:"rgba(255, 59, 48, 0.1)",
      errorTextBorderRadius:"8px",
      errorTextBorder:"none",
      errorTextColor: "rgb(255, 59, 48)",
      namePlaceholderTextFont:"400 15 Inter",
      namePlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
      nameInputBackground:"rgba(20, 20, 20, 0.04)",
      nameTextFont:"400 15 Inter",
      nameTextColor:"rgb(20, 20, 20)",
      nameInputBorder: "none",
      nameInputBorderRadius: "8px",
      nameInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
      passwordPlaceholderTextFont:"400 15 Inter",
      passwordPlaceholderTextColor:"rgba(20, 20, 20, 0.6)",
      passwordInputBackground:"rgba(20, 20, 20, 0.04)",
      passwordInputBorder: "none",
      passwordInputBorderRadius: "8px",
      passwordInputBoxShadow:"rgba(20, 20, 20, 0.04) 0 0 0 1px",
      passwordTextFont:"400 15 Inter",
      passwordTextColor:"rgb(20, 20, 20)",
      createGroupButtonTextFont:"600 15px Inter",
      createGroupButtonTextColor:"rgb(255, 255, 255)",
      createGroupButtonBackground:"rgb(51, 153, 255)",
      createGroupButtonBorderRadius:"8px"
   
    }
 }){
    this.onClose = onClose;
    this.hideCloseButton= hideCloseButton;
    this.onCreateGroup = onCreateGroup;
    this.closeButtonIconURL=closeButtonpIconURL;
    this.style=style
 }
}