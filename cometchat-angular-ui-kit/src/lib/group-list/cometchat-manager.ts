import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class GroupListManager extends CometChatManager {
    groupsRequest: CometChat.GroupsRequest;
    fetchNext() {
        return this.groupsRequest.fetchNext();
    }
    constructor(searchKey?: string) {
        super();
        if (searchKey) {
            this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
        } else {
            this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(30).build();
        }
    }
}
