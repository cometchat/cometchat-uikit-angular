/**
 * @class StatusIndicatorConfiguration
 * @param {string} width
 * @param {string} height
 * @param {string} border
 * @param {string} borderRadius
 * @param {string} onlineBackgroundColor
 * @param {string} offlineBackgroundColor
 * @param {string} status
 */
export class StatusIndicatorConfiguration {
	width = "10px";
	height = "10px";
	border = "none";
	borderRadius = "50%";

	constructor({
		width = "10px",
		height = "10px",
		border = "none",
		borderRadius = "50%",



	}) {
		this.width = width;
		this.height = height;
		this.border = border;
		this.borderRadius = borderRadius;


	}
}
