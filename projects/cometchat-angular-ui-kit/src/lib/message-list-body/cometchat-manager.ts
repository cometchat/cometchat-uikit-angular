import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class MessageListManager extends CometChatManager {
    messageRequest;
    limit = 30;
    id;
    constructor(id: string, type: string) {
        super();
        this.id = id;
        if (type == 'group') {
            this.messageRequest = new CometChat.MessagesRequestBuilder().setGUID(id).setLimit(this.limit).build();
        } else {

            this.messageRequest = new CometChat.MessagesRequestBuilder().setUID(id).setLimit(this.limit).build();
            // console.log("This is user",this.messageRequest);
        }

    }

    fetchNext() {
        return this.messageRequest.fetchNext();
    }

    fetchPrevious() {
        return this.messageRequest.fetchPrevious();
    }

    attachListener(callback) {
        const listenerID = 'UNIQUE_LISTENER_ID';

        CometChat.addMessageListener(
            listenerID,
            new CometChat.MessageListener({
                onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                    console.log('Text message received successfully', textMessage);
                    this.checkAndSendToCallBack(textMessage, callback);
                    // Handle text message
                },
                onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                    console.log('Media message received successfully', mediaMessage);
                    // Handle media message
                    this.checkAndSendToCallBack(mediaMessage, callback);
                },
                onCustomMessageReceived: (customMessage: CometChat.MediaMessage) => {

                    console.log('Custom message received successfully', customMessage);
                    // Handle custom message
                    this.checkAndSendToCallBack(customMessage, callback);
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
    }


    checkAndSendToCallBack(message: CometChat.BaseMessage | CometChat.MessageReceipt, callback: Function, isReceipt = false) {
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

