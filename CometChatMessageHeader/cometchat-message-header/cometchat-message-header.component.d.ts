import { AvatarStyle, BaseStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { ChangeDetectorRef, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { CometChatTheme } from '@cometchat/uikit-resources';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThemeService } from '../../CometChatTheme.service';
import { MessageHeaderStyle } from '@cometchat/uikit-shared';
import { Subscription } from 'rxjs';
import * as i0 from "@angular/core";
/**
*
* CometChatMessageHeader is a used to render listitem component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
export declare class CometChatMessageHeaderComponent implements OnInit, OnChanges {
    private ref;
    private themeService;
    avatarStyle: AvatarStyle;
    statusIndicatorStyle: BaseStyle;
    messageHeaderStyle: MessageHeaderStyle;
    listItemStyle: ListItemStyle;
    subtitleView: any;
    disableUsersPresence: boolean;
    disableTyping: boolean;
    protectedGroupIcon: string;
    privateGroupIcon: string;
    menu: any;
    user: CometChat.User;
    group: CometChat.Group;
    backButtonIconURL: string;
    hideBackButton: boolean;
    listItemView: TemplateRef<any>;
    onError: ((error: CometChat.CometChatException) => void) | null;
    onBack: () => void;
    groupsListenerId: string;
    userListenerId: string;
    subtitleText: string;
    loggedInUser: CometChat.User;
    isTyping: boolean;
    theme: CometChatTheme;
    ccGroupMemberAdded: Subscription;
    ccGroupLeft: Subscription;
    ccGroupMemberJoined: Subscription;
    ccGroupMemberKicked: Subscription;
    ccGroupMemberBanned: Subscription;
    ccOwnershipChanged: Subscription;
    onTypingStarted: Subscription;
    onTypingEnded: Subscription;
    constructor(ref: ChangeDetectorRef, themeService: CometChatThemeService);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    subscribeToEvents(): void;
    unsubscribeToEvents(): void;
    setListItemStyle(): void;
    setAvatarStyle(): void;
    setStatusStyle(): void;
    setHeadersStyle(): void;
    statusColor: any;
    backButtonStyle: any;
    checkStatusType: () => any;
    onBackClicked(): void;
    updateSubtitle(): void;
    getSubtitleView(): any;
    checkGroupType(): string;
    updateUserStatus(user: CometChat.User): void;
    attachListeners(): void;
    removeListener(): void;
    ngOnDestroy(): void;
    setTypingIndicatorText: (typing: CometChat.TypingIndicator) => void;
    headerStyle: () => {
        width: string | undefined;
        height: string | undefined;
        border: string | undefined;
        borderRadius: string | undefined;
        background: string | undefined;
    };
    subtitleStyle: () => {
        textFont: string | undefined;
        textColor: string | undefined;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatMessageHeaderComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatMessageHeaderComponent, "cometchat-message-header", never, { "avatarStyle": "avatarStyle"; "statusIndicatorStyle": "statusIndicatorStyle"; "messageHeaderStyle": "messageHeaderStyle"; "listItemStyle": "listItemStyle"; "subtitleView": "subtitleView"; "disableUsersPresence": "disableUsersPresence"; "disableTyping": "disableTyping"; "protectedGroupIcon": "protectedGroupIcon"; "privateGroupIcon": "privateGroupIcon"; "menu": "menu"; "user": "user"; "group": "group"; "backButtonIconURL": "backButtonIconURL"; "hideBackButton": "hideBackButton"; "listItemView": "listItemView"; "onError": "onError"; "onBack": "onBack"; }, {}, never, never>;
}
