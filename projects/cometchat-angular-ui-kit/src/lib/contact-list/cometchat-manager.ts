import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class ContactListManager extends CometChatManager {
    usersRequest;
    constructor(searchKey?) {
        super();
        if (searchKey) {
            this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(100).setSearchKeyword(searchKey).build();
        }
        else {
            this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(100).build();
        }

    }
    fetchNext() {
        return this.usersRequest.fetchNext();
    }
}
