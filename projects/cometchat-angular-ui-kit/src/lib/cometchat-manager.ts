import { CometChat } from '@cometchat-pro/chat';
import { callbackify } from 'util';

export class CometChatManager {
    isLoggedIn(callback?: (user?: CometChat.User, error?: any) => void) {
        const interval = setInterval(() => {
            if (CometChat.isInitialized()) {
                CometChat.getLoggedinUser().then((user: CometChat.User) => {
                    if (user) {
                        clearInterval(interval);
                        if (callback) {
                            callback(user, undefined);
                        }
                    }
                }, (err) => {
                    if (callback) {
                        callback(undefined, err);
                    }
                });
            }
        }, 300);
    }
}
