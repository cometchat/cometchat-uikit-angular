import { localize } from "../../Shared";
import { MessageTypes, MessageOption, MessageOptionForConstants } from "../../Shared/Constants/UIKitConstants";
/**
 * @class MessageOptions
 * @description MessageOptions class is used for defining the message options.
 *  * @param {string} id
 * @param {string} title
 * @param {string} iconURL
 * @param {any} callBack
 * @param {string} optionFor
 */
export class MessageOptions{
    public id:string = "";
    public title:string = "";
    public iconURL:string = "";
    public callBack:Function | null = null;
    public optionFor = "";
    constructor({id = "",title = "",iconURL = "",callBack = null as any,optionFor = ""}){
        this.id = id;
        this.title = title;
        this.iconURL = iconURL;
        this.callBack = callBack;
        this.optionFor = optionFor;
    };
  
     static getDefaultOptions = (type:any)=>{
       let options;
       switch (type) {
           case MessageTypes.text:
               options = [ this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.editMessage),this.getMessageOptions(MessageOption.reactToMessage),this.getMessageOptions(MessageOption.translateMessage),this.getMessageOptions(MessageOption.copyMessage)]
                break;
            case MessageTypes.file:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.audio:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.video:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.image:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.document:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.poll:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.sticker:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
            case MessageTypes.whiteboard:
                options = [this.getMessageOptions(MessageOption.deleteMessage),this.getMessageOptions(MessageOption.reactToMessage)]
                break;
           default:
               break;
       }
       return options
    }
    static getMessageOptions = (optionType:string) => {
        switch (optionType) {
          case MessageOption.deleteMessage: {
            return new MessageOptions({
              id: MessageOption.deleteMessage,
              title: localize("DELETE"),
              //inside style
              iconURL: "assets/resources/deleteicon.svg",
              callBack: null,
              optionFor: MessageOptionForConstants.sender,
            });
          }
          case MessageOption.editMessage: {
            return new MessageOptions({
              id: MessageOption.editMessage,
              title: localize("EDIT_MESSAGE"),
              //inside style
              iconURL: "assets/resources/editicon.svg",
              callBack: null,
              optionFor: MessageOptionForConstants.sender,
            });
          }
          case MessageOption.copyMessage: {
            return new MessageOptions({
              id: MessageOption.copyMessage,
              title: localize("COPY_MESSAGE"),
              iconURL: "assets/resources/Copy.svg",
              callBack: null,
              optionFor: MessageOptionForConstants.both,
            });
          }
          case MessageOption.translateMessage: {
            return new MessageOptions({
              id: MessageOption.translateMessage,
              title: localize("TRANSLATE_MESSAGE"),
              //inside style
              iconURL: "assets/resources/translation.svg",
              callBack: null,
              optionFor: MessageOptionForConstants.both,
            });
          }
          case MessageOption.reactToMessage: {
            return new MessageOptions({
              id: MessageOption.reactToMessage,
              title: localize("ADD_REACTION"),
              //inside style
              iconURL: "assets/resources/Reactionsicon.svg",
              callBack: null,
              optionFor: MessageOptionForConstants.both,
            });
          }
          default:
            return null;
        }
      };
}
const getDefaultMessageOptions = MessageOptions.getDefaultOptions
const getMessageOptions = MessageOptions.getMessageOptions
export { getDefaultMessageOptions ,getMessageOptions};