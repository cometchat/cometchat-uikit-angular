/**
 * @class CometChatMessageTemplate
 * @description CometChatMessageTemplate class is used for defining the message templates.
 *
 * @param {String} type
 * @param {String} icon
 * @param {String} name
 * @param {Function} actionCallback
 * @param {Function} customView
 * @param {Array} options
 */
import { MessageTypes ,MessageCategory} from "../../Shared/Constants/UIKitConstants";
import { MessageOptions } from "../CometChatMessageOptions/CometChatMessageOptions";
 class CometChatMessageTemplate {
	type: string;
	icon: string;
	name: string;
	actionCallback: any;
	customView: null;
	options: any[];
	category:string  = ""
	constructor({
		type = "",
		icon = "",
		name = "",
		actionCallback = null,
		customView = null,
		options = [] as any,
		category = ""
	}) {
		this.type = type;
		this.icon = icon;
		this.name = name;
		this.actionCallback = actionCallback;
		this.customView = customView;
		this.options = options;
		this.category = category;
	}

	  static getMessageTemplate= (type:string = "")=>{
		  switch (type) {
			  case MessageTypes.audio:
				return new CometChatMessageTemplate({
					type: MessageTypes.audio,
					icon: "assets/resources/audio-file.svg",
					name: "ATTACH_AUDIO",
					options: MessageOptions.getDefaultOptions(MessageTypes.audio),
					category: this.getDefaultCategory(MessageTypes.audio)
				  });

				  break;
			  case MessageTypes.video:
				return new CometChatMessageTemplate({
					type: MessageTypes.video,
					icon: "assets/resources/Video.svg",
					name: "ATTACH_VIDEO",
					options:MessageOptions.getDefaultOptions(MessageTypes.video),
					category: this.getDefaultCategory(MessageTypes.video)
				  });

				  break;
			  case MessageTypes.text:
				return new CometChatMessageTemplate({
					type: MessageTypes.text,
					icon:"assets/resources/photolibrary.svg",
					name: "TEXT",
					options:MessageOptions.getDefaultOptions(MessageTypes.text),
					category: this.getDefaultCategory(MessageTypes.text)
				  });

				  break;
			  case MessageTypes.file:
				return new CometChatMessageTemplate({
					type: MessageTypes.file,
					icon: "assets/resources/attachment-file.svg",
					name: "ATTACH_FILE",
					options:MessageOptions.getDefaultOptions(MessageTypes.file),
					category: this.getDefaultCategory(MessageTypes.file)
				  });
				  break;
			  case MessageTypes.document:
				return new CometChatMessageTemplate({
					type: MessageTypes.document,
					icon: "assets/resources/collaborativedocument.svg",
					name: "COLLABORATIVE_DOCUMENT",
					options:MessageOptions.getDefaultOptions(MessageTypes.document),
					category: this.getDefaultCategory(MessageTypes.document)
				  });

				  break;
			  case MessageTypes.whiteboard:
				   return new CometChatMessageTemplate({
					type: MessageTypes.whiteboard,
					icon: "assets/resources/collaborativewhiteboard.svg",
					name: "COLLABORATIVE_WHITEBOARD",
					options:MessageOptions.getDefaultOptions(MessageTypes.whiteboard),
					category: this.getDefaultCategory(MessageTypes.whiteboard)
				  });

				  break;
			  case MessageTypes.image:
				return 	new CometChatMessageTemplate({
					type: MessageTypes.image,
					icon: "assets/resources/photolibrary.svg",
					name: "ATTACH_IMAGE",
					options: MessageOptions.getDefaultOptions(MessageTypes.image),
					category: this.getDefaultCategory(MessageTypes.image)
				  });

				  break;
			  case MessageTypes.poll:
				return new CometChatMessageTemplate({
					type: MessageTypes.poll,
					icon: "assets/resources/Polls.svg",
					name: "CREATE_POLL",
					options:MessageOptions.getDefaultOptions(MessageTypes.poll),
					category: this.getDefaultCategory(MessageTypes.poll)
				  });

				  break;
			  case MessageTypes.sticker:
				return new CometChatMessageTemplate({
					type: MessageTypes.sticker,
					icon: "assets/resources/Stickers.svg",
					name: "STICKER",
					options:MessageOptions.getDefaultOptions(MessageTypes.sticker),
					category: this.getDefaultCategory(MessageTypes.sticker)
				  });

				  break;
				  case MessageTypes.groupMember:
					return new CometChatMessageTemplate({
						type: MessageTypes.groupMember,
						icon: "",
						name: "GROUP__MEMBER",
						options:[],
						category: MessageCategory.action
					  });
			  default:
				 return null;
				  break;
		  }
		// let defaultTypes = [this.groupAction,this.audioMessage,this.videoMessage,this.textMessage,this.imageMessage,this.pollMessage,this.stickerMessage,this.fileMessage,this.colaborativeWhiteBoard,this.colaborativeDocument]
		//   return defaultTypes
	  }
	  static getDefaultTypes = ()=>{
		 let types = [
			this.getMessageTemplate(MessageTypes.text),
			this.getMessageTemplate(MessageTypes.image),
			this.getMessageTemplate(MessageTypes.file),
			this.getMessageTemplate(MessageTypes.audio),
			this.getMessageTemplate(MessageTypes.video),
			this.getMessageTemplate(MessageTypes.poll),
			this.getMessageTemplate(MessageTypes.sticker),
			this.getMessageTemplate(MessageTypes.document),
			this.getMessageTemplate(MessageTypes.whiteboard),
			this.getMessageTemplate(MessageTypes.groupMember)

		 ]
		 return types
	  }
	  static getDefaultCategory(type:string):string{
		 let category;
		 switch (type) {
			case MessageTypes.audio:
			case MessageTypes.video:
			case MessageTypes.text:
			case MessageTypes.image:
			case MessageTypes.file:
				category = MessageCategory.message
				 break;
			case MessageTypes.edited:
			case MessageTypes.delete:
			case MessageTypes.groupMember:
				category = MessageCategory.action
				break;
			default:
				category = MessageCategory.custom
				 break;
		 }
		 return category
	  }
	  static getTemplate (type:string){
		  return new CometChatMessageTemplate({
			type: type,
			icon: "",
			name: type,
			options:MessageOptions.getDefaultOptions(type),
			category: this.getDefaultCategory(type)
		  });
		  
	  }
	//   static defaultTypes
}
const getDefaultTypes = CometChatMessageTemplate.getDefaultTypes
const getMessageTemplate = CometChatMessageTemplate.getMessageTemplate
export { CometChatMessageTemplate ,getDefaultTypes,getMessageTemplate};