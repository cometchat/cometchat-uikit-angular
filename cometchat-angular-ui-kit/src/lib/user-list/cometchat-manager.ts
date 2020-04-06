import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { USER_LIST_ACTIONS } from '../string_constants';

export class ContactListManager extends CometChatManager {

    usersRequest: CometChat.UsersRequest; // Users request of contact list manager;

    /**
     * Creates an instance of contact list manager.
     * @param [searchKey] :string it can be passed or can be blanked, if passed blank it will create,
     * `CometChat.UsersRequest` object with no filter else searchKey is use to filter the user's list
     */
    constructor(searchKey?: string, friendsOnly?) {
        super();
        if (searchKey) {
            if (friendsOnly) {
                this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(true).setSearchKeyword(searchKey).build();
            } else {
                this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
            }
        } else {
            if (friendsOnly) {
                this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(true).build();
            } else {
                this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
            }

        }
    }
    attachListener = (callback) => {

        const listenerID = 'UNIQUE_LISTENER_ID_USERS_LIST';

        CometChat.addUserListener(
            listenerID,
            new CometChat.UserListener({
                onUserOnline: (onlineUser: CometChat.User) => {
                    /* when someuser/friend comes online, user will be received here */

                    callback({ action: USER_LIST_ACTIONS.USER_STATUS_CHANGED.ONLINE, payload: { onlineUser } });

                },
                onUserOffline: (offlineUser: CometChat.User) => {
                    /* when someuser/friend went offline, user will be received here */

                    callback({ action: USER_LIST_ACTIONS.USER_STATUS_CHANGED.OFFLINE, payload: { offlineUser } });

                }
            })
        );
    }

    /**
     * Fetch next: function calls the CometChat `CometChat.UsersRequest`'s `fetchNext()`
     * function which returns the `Promise<CometChat.User[]>`
     * @returns  Promise<users:CometChat.User[]>
     */
    fetchNext() {
        return this.usersRequest.fetchNext();
    }
}
