
import {ConversationOption } from "../../Shared/Constants/UIKitConstants";
import { localize } from "../../Shared/PrimaryComponents/CometChatLocalize/cometchat-localize";
/**
 * @class conversationOptions 
 * @description conversationOptions class extends Options class and is used for defining the conversation options.
 * * @param {string} id
 * @param {string} title
 * @param {string} iconURL
 * @param {any} callBack
 */
export class ConversationOptions{
	public id:string = "";
    public title:string = "";
    public iconURL:string = "";
    public callBack:Function | null = null;
    constructor({id = "",title = localize("DELETE"),iconURL = "",callBack = null as any}){
        this.id = id;
        this.title = title
        this.iconURL = iconURL;
        this.callBack = callBack;
    };
	static getDefaultOptions = ()=>{
		return [
			new ConversationOptions({
				id: ConversationOption.delete,
				title: localize("DELETE"),
				//inside style
				iconURL: "assets/resources/deleteicon.svg",
				callBack: null,
			  })
		]
	 }

}
const getDefaultOptions = ConversationOptions.getDefaultOptions
export  {getDefaultOptions}