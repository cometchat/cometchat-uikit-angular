import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { USER_LIST_ACTIONS } from '../string_constants';

export class ConversationListManager extends CometChatManager {
    conversationRequest = new CometChat.ConversationsRequestBuilder().setLimit(30).build();
    listenerID = 'conversation_messages_listener' + new Date().getTime();
    fetchNext() {
        return this.conversationRequest.fetchNext();
    }

    attachListener(callback) {


        CometChat.addMessageListener(
            this.listenerID,
            new CometChat.MessageListener({
                onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                    this.checkAndSendToCallBack(textMessage, callback);
                },
                onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                    this.checkAndSendToCallBack(mediaMessage, callback);
                },
                onCustomMessageReceived: (customMessage: CometChat.MediaMessage) => {
                    this.checkAndSendToCallBack(customMessage, callback);
                }, onTypingStarted: typingIndicator => {

                },
                onMessagesDelivered: messageReceipt => {

                    this.checkAndSendToCallBack(messageReceipt, callback, true);
                },
                onMessagesRead: messageReceipt => {

                    this.checkAndSendToCallBack(messageReceipt, callback, true);
                },
                onTypingEnded: typingIndicator => {

                }
            })
        );



        CometChat.addCallListener(
            this.listenerID,
            new CometChat.CallListener({
                onIncomingCallReceived: (call) => {
                    this.checkAndSendToCallBack(call, callback);
                },
                onOutgoingCallAccepted: (call) => {
                    this.checkAndSendToCallBack(call, callback);

                },
                onOutgoingCallRejected: (call) => {
                    this.checkAndSendToCallBack(call, callback);

                },
                onIncomingCallCancelled: (call) => {
                    this.checkAndSendToCallBack(call, callback);
                }
            })
        );

    }

    distroyComponent() {
        CometChat.removeMessageListener(this.listenerID);
        CometChat.removeCallListener(this.listenerID);
        this.conversationRequest = null;
    }
    // tslint:disable-next-line: max-line-length
    checkAndSendToCallBack(message: CometChat.BaseMessage | CometChat.MessageReceipt, callback: (msg: CometChat.BaseMessage | CometChat.MessageReceipt, isReceipt?: boolean) => void, isReceipt = false) {
        if (!isReceipt) {
            const msg: CometChat.BaseMessage = message as CometChat.BaseMessage;
            callback(msg, false);
        } else {
            const msgReceipt: CometChat.MessageReceipt = message as CometChat.MessageReceipt;
            callback(msgReceipt, true);
        }

    }



    attachUserListener(callback) {

        // const listenerID = 'UNIQUE_LISTENER_ID_USERS_LIST';

        CometChat.addUserListener(
            this.listenerID,
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
}
