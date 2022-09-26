
/**
 * @class ConversationWithMessagesConfiguration
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} count
 */
export class BadgeCountConfiguration {
	width = "24px";
	height = "20px";
	border = "1px solid transparent";
	borderRadius = "11px";
	count = "0";
	constructor(
		{
			width = "24px",
			height = "20px",
			border = "1px solid transparent",
			borderRadius = "11px",
			count = "0"
		}
	) {
		this.width = width;
		this.height = height;
		this.border = border;
		this.borderRadius = borderRadius;
		this.count = count
	}
}
