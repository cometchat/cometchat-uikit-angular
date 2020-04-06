import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class MessageListManager extends CometChatManager {
    messageRequest: CometChat.MessagesRequest;
    limit = 100;
    id;
    listenerId;
    constructor(id, type = 'user') {
        super();
        this.listenerId = 'UNIQUE_LISTENER_ID' + new Date().getTime();
        this.id = id;
        if (type === 'user') {
            this.messageRequest = new CometChat.MessagesRequestBuilder().setUID(id).setLimit(this.limit).build();
        } else {
            this.messageRequest = new CometChat.MessagesRequestBuilder().setGUID(id).setLimit(this.limit).build();
        }
    }
    fetchPrevious() {
        return this.messageRequest.fetchPrevious();
    }
    attachListener(callback) {

        CometChat.addMessageListener(
            this.listenerId,
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
                    // TODO handle typing started
                },
                onMessagesDelivered: messageReceipt => {
                    this.checkAndSendToCallBack(messageReceipt, callback, true);
                },
                onMessagesRead: messageReceipt => {
                    this.checkAndSendToCallBack(messageReceipt, callback, true);
                },
                onTypingEnded: typingIndicator => {
                    // TODO handle typing ended with care
                }
            })
        );
        CometChat.addCallListener(
            this.listenerId,
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

        CometChat.addGroupListener(
            this.listenerId,
            new CometChat.GroupListener({
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onGroupMemberLeft: (message, leavingUser, group) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {

                    this.checkAndSendToCallBack(message, callback);
                },
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {


                }
            })
        );


    }

    removeListeners() {

        CometChat.removeMessageListener(this.listenerId);
        CometChat.removeGroupListener(this.listenerId);
        CometChat.removeCallListener(this.listenerId);
    }
    // tslint:disable-next-line: max-line-length
    checkAndSendToCallBack(message: CometChat.BaseMessage | CometChat.MessageReceipt, callback: (msg: CometChat.BaseMessage | CometChat.MessageReceipt, isReceipt?: boolean) => void, isReceipt = false) {
        if (!isReceipt) {
            const msg: CometChat.BaseMessage = message as CometChat.BaseMessage;
            if (msg.getReceiverType() === 'user') {
                if (this.id === msg.getSender().getUid()) {
                    callback(msg);
                }
            } else {
                if (this.id === msg.getReceiverId()) {
                    callback(msg);
                }
            }
        } else {
            const msgReceipt: CometChat.MessageReceipt = message as CometChat.MessageReceipt;
            if (msgReceipt.getReceiverType() === 'user') {
                if (this.id === msgReceipt.getSender().getUid()) {
                    callback(msgReceipt, true);
                }
            } else {
                if (this.id === msgReceipt.getReceiver()) {
                    callback(msgReceipt, true);
                }
            }
        }

    }

}
