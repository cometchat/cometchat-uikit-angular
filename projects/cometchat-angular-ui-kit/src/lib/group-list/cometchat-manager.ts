import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class GroupListManager extends CometChatManager {
    groupsRequest;
    constructor(searchKey?) {
        super();
        if (searchKey) {
            this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(100).setSearchKeyword(searchKey).build();
        } else {
            this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(100).build();
        }
    }

    fetchNext() {
        return this.groupsRequest.fetchNext();
    }
}
