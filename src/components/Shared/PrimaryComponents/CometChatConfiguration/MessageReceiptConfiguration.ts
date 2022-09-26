/**
 * @class MessageReceiptConfiguration
 * @param {string} messageWaitIcon
 * @param {string} messageSentIcon
 * @param {string} messageDeliveredIcon
 * @param {string} messageReadIcon
 * @param {string} messageErrorIcon

 */
export class MessageReceiptConfiguration {
	messageWaitIcon = "assets/resources/wait.svg";
	messageSentIcon = "assets/resources/message-sent.svg";
	messageDeliveredIcon = "assets/resources/message-delivered.svg";
	messageReadIcon = "assets/resources/message-read.svg";
	messageErrorIcon = "assets/resources/warning-small.svg";
	constructor({
		messageWaitIcon = "assets/resources/wait.svg",
		messageSentIcon = "assets/resources/message-sent.svg",
		messageDeliveredIcon = "assets/resources/message-delivered.svg",
		messageReadIcon = "assets/resources/message-read.svg",
		messageErrorIcon = "assets/resources/warning-small.svg",

	}) {
		this.messageWaitIcon = messageWaitIcon;
		this.messageSentIcon = messageSentIcon;
		this.messageDeliveredIcon = messageDeliveredIcon;
		this.messageReadIcon = messageReadIcon;
		this.messageErrorIcon = messageErrorIcon;

	}

};
