import { CometChatManager } from '../cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

export class ConversationHeaderManager extends CometChatManager {
    id: string;
    constructor(id, type = 'user') {
        super();
        this.id = id;
    }

}
