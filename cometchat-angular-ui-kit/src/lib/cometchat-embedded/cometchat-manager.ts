import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { CONVERSATION_SCREEN_HEADER_ACTIONS, CALL_SCREEN_ACTIONS } from '../string_constants';

export class CometChatMainManager extends CometChatManager {

    constructor() {
        super();
    }

    attachListener = (callback) => {

        const listenerID = 'UNIQUE_LISTENER_MAIN_COMPONENT';


        CometChat.addCallListener(
            listenerID,
            new CometChat.CallListener({
                onIncomingCallReceived(call) {

                    callback({ action: CALL_SCREEN_ACTIONS.INCOMING_CALL_RECEIVED, payload: { call } });
                },
                onOutgoingCallAccepted(call) {

                    callback({ action: CALL_SCREEN_ACTIONS.OUTGOING_CALL_ACCEPTED, payload: { call } });
                },
                onOutgoingCallRejected(call) {

                    callback({ action: CALL_SCREEN_ACTIONS.OUTGOING_CALL_REJECTED, payload: { call } });

                },
                onIncomingCallCancelled(call) {

                    callback({ action: CALL_SCREEN_ACTIONS.INCOMING_CALL_CANCELLED, payload: { call } });

                }
            })
        );



    }

}
