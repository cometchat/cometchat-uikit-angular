import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class ConversationHeaderManager extends CometChatManager {
    id: string;
    constructor(id, type = 'user') {
        super();
        this.id = id;
    }
    attachListener = (callback) => {
        const listenerID = 'UNIQUE_LISTENER_ID';

        CometChat.addUserListener(
            listenerID,
            new CometChat.UserListener({
                onUserOnline: (onlineUser: CometChat.User) => {
                    /* when someuser/friend comes online, user will be received here */
                    if (onlineUser.getUid() === this.id) {
                        callback(onlineUser);
                    }
                },
                onUserOffline: (offlineUser: CometChat.User) => {
                    /* when someuser/friend went offline, user will be received here */
                    if (offlineUser.getUid() === this.id) {
                        callback(offlineUser);
                    }
                }
            })
        );
    }

}
