import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { CONVERSATION_SCREEN_HEADER_ACTIONS } from '../string_constants';

export class ConversationHeaderManager extends CometChatManager {
    id: string;
    type: string;
    constructor(id, type = 'user') {
        super();
        this.id = id;
        this.type = type;
    }
    attachListener = (callback) => {
        if (this.type === 'user') {
            const listenerID = 'UNIQUE_LISTENER_ID_CONVERSATION_HEADER';

            CometChat.addUserListener(
                listenerID,
                new CometChat.UserListener({
                    onUserOnline: (onlineUser: CometChat.User) => {
                        /* when someuser/friend comes online, user will be received here */
                        if (onlineUser.getUid().toString() === this.id.toString()) {
                            callback({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.USER_STATUS_CHANGED.ONLINE, payload: { onlineUser } });
                        }
                    },
                    onUserOffline: (offlineUser: CometChat.User) => {
                        /* when someuser/friend went offline, user will be received here */
                        if (offlineUser.getUid().toString() === this.id.toString()) {
                            callback({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.USER_STATUS_CHANGED.OFFLINE, payload: { offlineUser } });
                        }
                    }
                })
            );
            CometChat.addMessageListener(
                listenerID,
                new CometChat.MessageListener({
                    onTypingStarted: typingIndicator => {
                        callback({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.TYPING_STATUS_CHANGED.TYPING_STARTED, payload: { typingIndicator } });
                    },
                    onTypingEnded: typingIndicator => {

                        callback({ action: CONVERSATION_SCREEN_HEADER_ACTIONS.TYPING_STATUS_CHANGED.TYPING_ENDED, payload: { typingIndicator } });
                    }
                })
            );
        }
    }

}
