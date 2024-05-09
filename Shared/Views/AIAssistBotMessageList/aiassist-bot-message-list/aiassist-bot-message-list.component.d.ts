import { CometChatThemeService } from "./../../../../CometChatTheme.service";
import { CometChatException } from "@cometchat/chat-sdk-javascript";
import { OnInit, TemplateRef, ChangeDetectorRef, ElementRef } from "@angular/core";
import { AvatarStyle, TextInputStyle, DateStyle } from "@cometchat/uikit-elements";
import { CometChatMessageTemplate, MessageListAlignment, MessageBubbleAlignment, DatePatterns } from "@cometchat/uikit-resources";
import { BaseStyle } from "@cometchat/uikit-shared";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
export declare class AIAssistBotMessageListComponent implements OnInit {
    private ref;
    private themeService;
    messagesList: CometChat.BaseMessage[];
    botMessagesList: CometChat.BaseMessage[];
    hideSearch: boolean;
    footerView: TemplateRef<any>;
    user: CometChat.User;
    group: CometChat.Group;
    currentAskAIBot: any;
    subtitleText: string;
    sendIconUrl: string;
    waitIcon: string;
    errorIcon: string;
    botFirstMessageText: string;
    closeButtonIconURL: string;
    sendButtonIconURL: string;
    avatarStyle: AvatarStyle;
    aiBotChatHeaderStyle: any;
    aiBotChatContainerStyle: any;
    datePattern: DatePatterns;
    bubbleDateStyle: DateStyle;
    inputRef: ElementRef;
    ccChatChanged: Subscription;
    messageTemplate: CometChatMessageTemplate[];
    alignment: MessageListAlignment;
    loggedInUser: CometChat.User;
    receipts: any;
    currentMessageObject: CometChat.BaseMessage | null;
    typesMap: any;
    messageTypesMap: any;
    inputValue: string;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnInit(): void;
    setAvatarStyle(): void;
    setAiBotChatHeader(): void;
    setAiBotChatContainerStyle(): void;
    ngOnDestroy(): void;
    subscribeToEvents(): void;
    unSubscribeToEvent(): void;
    onError(error: CometChatException): void;
    generateRandomString(length: any): string;
    handleClick(): void;
    setMessageBubbleStyle(msg: CometChat.BaseMessage): BaseStyle;
    getBubbleAlignment(message: CometChat.BaseMessage): MessageBubbleAlignment.left | MessageBubbleAlignment.right;
    textInputStyle: TextInputStyle;
    sendButtonStyle: any;
    messageInputChanged: (event: any) => void;
    closeButtonStyle: any;
    labelStyle: any;
    onCloseDetails(): void;
    setMessagesStyle(): void;
    getBotTitleStyle(): {
        font: string;
        color: string | undefined;
    };
    getBotSubtitleStyle(): {
        font: string;
        color: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<AIAssistBotMessageListComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AIAssistBotMessageListComponent, "aiassist-bot-message-list", never, { "hideSearch": "hideSearch"; "footerView": "footerView"; "user": "user"; "group": "group"; "currentAskAIBot": "currentAskAIBot"; "subtitleText": "subtitleText"; "sendIconUrl": "sendIconUrl"; "waitIcon": "waitIcon"; "errorIcon": "errorIcon"; "botFirstMessageText": "botFirstMessageText"; "closeButtonIconURL": "closeButtonIconURL"; "sendButtonIconURL": "sendButtonIconURL"; "avatarStyle": "avatarStyle"; "aiBotChatHeaderStyle": "aiBotChatHeaderStyle"; "aiBotChatContainerStyle": "aiBotChatContainerStyle"; "datePattern": "datePattern"; "alignment": "alignment"; }, {}, never, never>;
}