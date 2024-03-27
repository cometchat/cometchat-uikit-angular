import { AvatarStyle, BaseStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from "@angular/core";
import { MessageComposerConfiguration, MessageComposerStyle, MessageListConfiguration, ThreadedMessagesStyle } from "@cometchat/uikit-shared";
import { CometChatThemeService } from "../../CometChatTheme.service";
import { Subscription } from "rxjs";
import * as i0 from "@angular/core";
/**
*
* CometChatThreadedMessagesComponent is a wrapper component for messageList, messageBubble, messageComposer  component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatThreadedMessagesComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    onClose: (() => void) | null;
    onError: ((error: CometChat.CometChatException) => void) | null;
    parentMessage: any;
    title: string;
    closeIconURL: string;
    bubbleView: TemplateRef<any>;
    messageActionView: TemplateRef<any>;
    messageListConfiguration: MessageListConfiguration;
    messageComposerConfiguration: MessageComposerConfiguration;
    threadedMessagesStyle: ThreadedMessagesStyle;
    user: CometChat.User;
    group: CometChat.Group;
    loggedInUser: CometChat.User | null;
    limit: number;
    requestBuilder: CometChat.MessagesRequestBuilder;
    composerStyles: MessageComposerStyle;
    avatarStyle: AvatarStyle;
    statusIndicatorStyle: BaseStyle;
    listItemStyle: ListItemStyle;
    actionButtonStyle: any;
    buttonStyle: any;
    titleStyle: any;
    ccMessageSent: Subscription;
    ccMessageEdited: Subscription;
    ccMessageDeleted: Subscription;
    ccMessageRead: Subscription;
    onMessagesDelivered: Subscription;
    onMessagesRead: Subscription;
    onMessageDeleted: Subscription;
    onMessageEdited: Subscription;
    onTextMessageReceived: Subscription;
    onCustomMessageReceived: Subscription;
    onFormMessageReceived: Subscription;
    onSchedulerMessageReceived: Subscription;
    onCardMessageReceived: Subscription;
    onCustomInteractiveMessageReceived: Subscription;
    onMediaMessageReceived: Subscription;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnInit(): void;
    ngOnChanges(change: SimpleChanges): void;
    ngOnDestroy(): void;
    updateMessage(message: CometChat.BaseMessage): void;
    updateReceipt(messageReceipt: CometChat.MessageReceipt): void;
    addMessageEventListeners(): void;
    getThreadCount(): string;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    closeView(): void;
    setThreadedMessagesStyle(): void;
    setTheme(): void;
    wrapperStyle(): {
        background: string | undefined;
        height: string | undefined;
        width: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatThreadedMessagesComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatThreadedMessagesComponent, "cometchat-threaded-messages", never, { "onClose": "onClose"; "onError": "onError"; "parentMessage": "parentMessage"; "title": "title"; "closeIconURL": "closeIconURL"; "bubbleView": "bubbleView"; "messageActionView": "messageActionView"; "messageListConfiguration": "messageListConfiguration"; "messageComposerConfiguration": "messageComposerConfiguration"; "threadedMessagesStyle": "threadedMessagesStyle"; }, {}, never, never>;
}
