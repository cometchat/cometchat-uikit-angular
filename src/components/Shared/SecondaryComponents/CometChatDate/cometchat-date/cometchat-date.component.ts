import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from "@angular/core"
import {  dateFormat, messageConstants, timeFormat } from "../../../Constants/UIKitConstants";
@Component({
	selector: "cometchat-date",
	templateUrl: "./cometchat-date.component.html",
	styleUrls: ["./cometchat-date.component.scss"],
})
export class CometChatDateComponent implements OnInit, OnChanges {
	@Input() pattern: string = dateFormat.dayDateTimeFormat;
	@Input() dateFormat: string = "mm:dd:yyyy" //dd MM yyyy
	@Input() timeStamp: number = 0
	@Input() timeStampFont: string = ""
	@Input() timeStampColor: string = ""
	@Input() timeFormat: any = timeFormat.twelvehours;
	@Input() backgroundColor: string = ""
	@Input()borderRadius: string = ""
	public monthNames: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	public gmtTime!: Date;
	public lastDigit!: number;
	public stampDate!: number | string;
	constructor() { }
	/**
 * 
 * CometChatDateComponent is used to show date in different formats.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
	ngOnChanges(changes: SimpleChanges) {
		if (changes["timeStamp"]) {
			this.gmtTime = new Date(this.timeStamp * 1000)
			this.lastDigit = this.gmtTime.getDate();
			this.stampDate = this.lastDigit;
		}
	}
	ngOnInit() {
	}
	/**
	 * dayDateTimeFormat : time, day,WWW,year for conversationList
	 */
	getLastMessageTimestamp() {
		try {
			let time = this.timeStamp
			let timestamp = null;
			const messageTimestamp: any = new Date(time * 1000);
			const currentTimestamp = Date.now();
			const diffTimestamp = currentTimestamp - messageTimestamp;
			if (diffTimestamp < 24 * 60 * 60 * 1000) {
				timestamp = messageTimestamp.toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "numeric",
					hour12: true,
				});
			} else if (diffTimestamp < 48 * 60 * 60 * 1000) {
				timestamp = messageConstants.YESTERDAY;
			} else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {
				timestamp = messageTimestamp.toLocaleString("en-US", {
					weekday: "long",
				});
			} else {
				timestamp = messageTimestamp.toLocaleDateString("en-US", {
					year: "2-digit",
					month: "2-digit",
					day: "2-digit",
				});
			}
			;
			return timestamp;
		} catch (error:any) {
			
		}
	}
	//"DD:MM:YYYY"
	/**
	 * @param  {number} lastDigit
	 * @param  {Date} gmtTime
	 */
	dateWithYear = (lastDigit: number, gmtTime: Date) => {
		if (this.dateFormat == "mm:dd:yyyy") {
			let dateStr = this.stampDate;

			return this.monthNames[gmtTime.getMonth()]?.slice(0, 3) + " " + dateStr + ", " + gmtTime.getFullYear();
			
		}
		else {
			let dateStr = this.stampDate;
			if (lastDigit === 1) {
				dateStr = this.stampDate + "st";
			} else if (lastDigit === 2) {
				dateStr = this.stampDate + "nd";
			} else if (lastDigit === 3) {
				dateStr = this.stampDate + "rd";
			} else {
				dateStr = this.stampDate + "th";
			}
			return dateStr + " " + this.monthNames[gmtTime.getMonth()].slice(0, 3) + " " + gmtTime.getFullYear();
		}
	}
	//HH:MM AM/PM
	/**
	 * @param  {Date} gmtTime
	 */
	twelveHours = (gmtTime: Date) => {
		let timeWithSec = gmtTime.toLocaleTimeString("en-US");
		let lastIndex = timeWithSec.lastIndexOf(":");
		let timeWithoutSec = timeWithSec.slice(0, lastIndex) + timeWithSec.slice(lastIndex + 3);
		return timeWithoutSec;
	}
	//HH:MM
	/**
	 * @param  {Date} gmtTime
	 */
	twentyFourHours = (gmtTime: Date) => {
		return gmtTime.getHours() + ":" + gmtTime.getMinutes();
	}
	/**
	 * @param  {number} lastDigit
	 * @param  {Date} gmtTime
	 */
	shortTime = (lastDigit: number, gmtTime: Date) => {
		let dateStr = "";
		if (lastDigit === 1) {
			dateStr = this.stampDate + "st";
		} else if (lastDigit === 2) {
			dateStr = this.stampDate + "nd";
		} else if (lastDigit === 3) {
			dateStr = this.stampDate + "rd";
		} else {
			dateStr = this.stampDate + "th";
		}
		return dateStr + " " + this.monthNames[gmtTime.getMonth()].slice(0, 3);
	}
	/**
	 * showing 12 or 24 hour time based on timeFormat
	 * @param  {Date} date
	 */
	hourMinutes(date: Date) {
		if (this.timeFormat == timeFormat.twelvehours) {
			return this.twelveHours(date)
		}
		else {
			return this.twentyFourHours(date)
		}
	}
	setDate = () => {
		let messageDate = null;
		switch (this.pattern) {
			case dateFormat.dayDateTimeFormat: {
				messageDate = this.getLastMessageTimestamp();
				break;
			}
			case dateFormat.dayDateFormat: {
				messageDate = this.dateWithYear(this.lastDigit, this.gmtTime);
				break;
			}
			case dateFormat.timeFormat: {
				messageDate = this.hourMinutes(this.gmtTime);
				break;
			}
			// case "hh:mm am/pm": {
			// 	messageDate = this.twelveHours(this.gmtTime);
			// 	break;
			// }
			// case "hh:mm": {
			// 	messageDate = this.twentyFourHours(this.gmtTime);
			// 	break;
			// }
			default:
				break;
		}
		return messageDate;
	};
	// styles 
	timeStyle = () => {
		return {
			font: this.timeStampFont,
			color: this.timeStampColor,
			backgroundColor: this.backgroundColor,
			borderRadius: this.borderRadius,
		}
	}
}
