export declare class CallLogUtils {
    static isSentByMe(call: any, loggedInUser: CometChat.User): boolean;
    static isMissedCall(call: any, loggedInUser: CometChat.User): boolean;
    static getCallStatusWithType(call: any, loggedInUser: CometChat.User, includeType?: boolean): string;
    static convertMinutesToHoursMinutesSeconds(minutes: number): string;
    static convertSecondsToHoursMinutesSeconds(seconds: number): string;
    static isDateDifferent(firstDate: number | undefined, secondDate: number | undefined): boolean;
}
