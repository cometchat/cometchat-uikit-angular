import { dateFormat as dFormat, timeFormat as tFormat } from "../../Constants/UIKitConstants";
/**
 * @class ConversationWithMessagesConfiguration
 * @param {string} pattern
 * @param {string} dateFormat
 * @param {string} timeFormat

 */
export class DateConfiguration {
    pattern: string = dFormat.dayDateTimeFormat;
    dateFormat: string = "mm:dd:yyyy" //dd MM yyyy
    timeFormat: any = tFormat.twelvehours;
    constructor({
        pattern = dFormat.dayDateTimeFormat,
        dateFormat = "mm:dd:yyyy",
        timeStampFont = "",
        timeStampColor = "",
        timeFormat = tFormat.twelvehours,
        backgroundColor = "",
        borderRadius = "",
    }) {
        this.pattern = pattern
        this.dateFormat = dateFormat
        this.timeFormat = timeFormat

    }


}