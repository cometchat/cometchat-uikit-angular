import { CometChat } from '@cometchat-pro/chat'
import { BadgeCountConfiguration, MessageReceiptConfiguration, StatusIndicatorConfiguration } from '../..';
import { ConversationInputData } from '../../InputData/ConversationInputData';
import { AvatarConfiguration } from './AvatarConfiguration';
type functionType = (object: CometChat.Conversation) => String;
/**
 * @class ConversationWithMessagesConfiguration
 * @param {Object} InputData
 * @param {boolean} showTypingIndicator
 * @param {boolean} hideThreadIndicator
 */
export class ConversationListItemConfiguration {
	 avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({});
	 statusIndicatorConfiguration: StatusIndicatorConfiguration = new StatusIndicatorConfiguration({});
	 badgeCountConfiguration: BadgeCountConfiguration = new BadgeCountConfiguration({});
	 messageReceiptConfiguration: MessageReceiptConfiguration = new MessageReceiptConfiguration({});
	InputData:ConversationInputData = {
		id: true,
		thumbnail: true,
		status: true,
		title: true,
		subtitle:  "",
		time: true,
		unreadCount: true,
		readReceipt: true
	};

	showTypingIndicator:boolean = true;
	hideThreadIndicator:boolean = false;

	constructor({
		InputData = {
			id: true,
			thumbnail: true,
			status: true,
			title: true,
			subtitle: "",
			time: true,
			unreadCount: true,
			readReceipt: true
		},
		showTypingIndicator = true,
		hideThreadIndicator = true,
		avatarConfiguration = new AvatarConfiguration({}),
		statusIndicatorConfiguration = new StatusIndicatorConfiguration({}),
		badgeCountConfiguration = new BadgeCountConfiguration({}),
		messageReceiptConfiguration = new MessageReceiptConfiguration({}),


	}) {
		this.InputData = InputData
		this.showTypingIndicator = showTypingIndicator
		this.hideThreadIndicator = hideThreadIndicator
		this.avatarConfiguration = avatarConfiguration;
		this.statusIndicatorConfiguration = statusIndicatorConfiguration;
		this.badgeCountConfiguration = badgeCountConfiguration;
		this.messageReceiptConfiguration = messageReceiptConfiguration;
	}




}
