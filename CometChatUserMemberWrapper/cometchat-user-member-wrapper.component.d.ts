import { AvatarStyle, ListItemStyle } from '@cometchat/uikit-elements';
import { UserMemberListType, UserPresencePlacement } from '@cometchat/uikit-resources';
import { CometChatThemeService } from '../CometChatTheme.service';
import * as i0 from "@angular/core";
export declare class CometChatUserMemberWrapperComponent {
    private themeService;
    userMemberListType: UserMemberListType;
    onItemClick: (userMember: CometChat.User | CometChat.GroupMember) => void;
    listItemView: any;
    avatarStyle: AvatarStyle;
    statusIndicatorStyle: any;
    searchKeyword: string;
    group: CometChat.Group;
    subtitleView?: any;
    usersRequestBuilder: CometChat.UsersRequestBuilder;
    disableUsersPresence: boolean;
    userPresencePlacement: UserPresencePlacement;
    hideSeperator: boolean;
    loadingStateView: any;
    onEmpty?: () => void;
    onError?: (error: CometChat.CometChatException) => void;
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder;
    loadingIconUrl: string;
    disableLoadingState: boolean;
    userMemberListTypeEnum: typeof UserMemberListType;
    constructor(themeService: CometChatThemeService);
    listItemStyle: ListItemStyle;
    getUsersStyle: () => {
        border: string;
        background: string | undefined;
        borderRadius: string;
    };
    getGroupMemebersStyle: () => {
        border: string;
        padding: string;
        background: string | undefined;
        borderRadius: string;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<CometChatUserMemberWrapperComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CometChatUserMemberWrapperComponent, "cometchat-user-member-wrapper", never, { "userMemberListType": "userMemberListType"; "onItemClick": "onItemClick"; "listItemView": "listItemView"; "avatarStyle": "avatarStyle"; "statusIndicatorStyle": "statusIndicatorStyle"; "searchKeyword": "searchKeyword"; "group": "group"; "subtitleView": "subtitleView"; "usersRequestBuilder": "usersRequestBuilder"; "disableUsersPresence": "disableUsersPresence"; "userPresencePlacement": "userPresencePlacement"; "hideSeperator": "hideSeperator"; "loadingStateView": "loadingStateView"; "onEmpty": "onEmpty"; "onError": "onError"; "groupMemberRequestBuilder": "groupMemberRequestBuilder"; "loadingIconUrl": "loadingIconUrl"; "disableLoadingState": "disableLoadingState"; }, {}, never, never>;
}
