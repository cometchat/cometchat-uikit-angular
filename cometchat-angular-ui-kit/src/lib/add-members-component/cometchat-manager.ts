import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class GroupMembersManager extends CometChatManager {

    usersRequest: CometChat.UsersRequest;

    limit = 12;
    constructor() {
        super();
        this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(this.limit).build();
    }

    fetchNextUsers = () => {
        return this.usersRequest.fetchNext();
    }

}
