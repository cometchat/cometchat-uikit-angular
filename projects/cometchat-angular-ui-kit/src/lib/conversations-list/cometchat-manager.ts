import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class ConversationListManager extends CometChatManager {
    conversationRequest = new CometChat.ConversationsRequestBuilder().setLimit(50).build();
    fetchNext() {
        return this.conversationRequest.fetchNext();
    }

    attachListener(callback) {
        const listenerID = 'UNIQUE_LISTENER_ID';

        CometChat.addMessageListener(
            listenerID,
            new CometChat.MessageListener({
                onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                    callback(textMessage, false);
                },
                onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                    callback(mediaMessage, false);
                },
                onCustomMessageReceived: (customMessage: CometChat.MediaMessage) => {
                    callback(customMessage, false);
                },
                onMessagesDelivered: messageReceipt => {
                    
                    callback(messageReceipt, true);
                },
                onMessagesRead: messageReceipt => {
                    
                    callback(messageReceipt, true);
                },
                onTypingEnded: typingIndicator => {

                }
            })
        );
    }




}
