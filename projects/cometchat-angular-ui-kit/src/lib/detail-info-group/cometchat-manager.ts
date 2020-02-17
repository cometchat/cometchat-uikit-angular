import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class GroupsDetailsManager extends CometChatManager {
    group: Object | any = {
        guid: ''
    };
    groupMemberRequest;
    constructor(group) {
        super();
        this.group = group
        this.groupMemberRequest = new CometChat.GroupMembersRequestBuilder(this.group.guid).setLimit(100)
            .build();
    }

    fetchNext() {
       return this.groupMemberRequest.fetchNext();
    }



}
