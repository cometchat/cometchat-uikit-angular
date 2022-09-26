/**
 * @class ConversationWithMessagesConfiguration
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} outerView
 * @param {string} outerViewSpacing
 */


export class AvatarConfiguration {
	width: string = "36px";
	height: string = "36px";
	border: string = "1px solid rgba(20, 20, 20, 8%)";
	borderRadius: string = "24px";
	outerView: string = "none";
	outerViewSpacing: string = "none";
	constructor({
		width = "36px",
		height = "36px",
		border = "1px solid rgba(20, 20, 20, 8%)",
		borderRadius = "24px",
		outerView = "none",
		outerViewSpacing = "none",

	}) {
		this.width = width;
		this.height = height;
		this.border = border;
		this.borderRadius = borderRadius;
		this.outerView = outerView
		this.outerViewSpacing = outerViewSpacing;

	}

};
