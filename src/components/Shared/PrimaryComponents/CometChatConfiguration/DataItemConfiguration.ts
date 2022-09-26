
import { CometChat } from '@cometchat-pro/chat';
import * as types from '../../Types/typesDeclairation'
import { inputData } from '../../SDKDerivedComponents/CometChatDataItem/DataItemInterface';
import { conversationConstants, MessageReceiverType } from '../../Constants/UIKitConstants';
import { localize } from '../CometChatLocalize/cometchat-localize';
import { AvatarConfiguration } from './AvatarConfiguration';
import { StatusIndicatorConfiguration } from './StatusIndicatorConfiguration';
type callBack = (user: CometChat.User | null, group: CometChat.Group | null, groupMember: CometChat.GroupMember | null) => String;

/**
 * @class ConversationWithMessagesConfiguration
 * @param {object} inputData
 * @param {string} isActive
 * @param {array} options
 */
export class DataItemConfiguration {
	inputData!: inputData;
	options = {};
	avatarConfiguration:AvatarConfiguration = new AvatarConfiguration({})
	statusIndicatorConfiguration:StatusIndicatorConfiguration = new StatusIndicatorConfiguration({})
	constructor(
		{ inputData = {
			thumbnail: true,
			title: true,
			subtitle: "",
			status: true
		},
			options = {}, 
			avatarConfiguration = new AvatarConfiguration({}),
			statusIndicatorConfiguration =  new StatusIndicatorConfiguration({})
		
		}
	) {
		this.inputData = inputData
		this.options = options;
		this.avatarConfiguration = avatarConfiguration;
		this.statusIndicatorConfiguration = statusIndicatorConfiguration;


	}



}
