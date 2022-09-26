
import {ConversationOption } from "../../Shared/Constants/UIKitConstants";
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
    constructor({id = "",title = "",iconURL = "",callBack = null as any}){
        this.id = id;
        this.title = title
        this.iconURL = iconURL;
        this.callBack = callBack
    };
	static conversationOptions: any = {
		DELETE: 
		new ConversationOptions({
			id: ConversationOption.delete,
			title: ConversationOption.delete,
			//inside style
			iconURL: "assets/resources/deleteicon.svg",
			callBack: null
	}),
	}
	 static getDefaultOptions = ()=>{
	   let options = [this.conversationOptions.DELETE];

	   return options
	}
}
const getDefaultOptions = ConversationOptions.getDefaultOptions
export  {getDefaultOptions}