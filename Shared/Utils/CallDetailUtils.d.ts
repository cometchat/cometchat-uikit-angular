import { CometChatCallDetailsTemplate, CometChatTheme } from "@cometchat/uikit-resources";
export declare class CallDetailUtils {
    static getDefaultCallTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): Array<CometChatCallDetailsTemplate>;
    static getPrimaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallDetailsTemplate;
    private static getPrimaryOptions;
    static getSecondaryDetailsTemplate(callLog: any, loggedInUser: CometChat.User, theme: CometChatTheme): CometChatCallDetailsTemplate;
    private static getSecondaryOptions;
}
