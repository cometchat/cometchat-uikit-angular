/**
 * Public API for CometChatMessageList component
 */

// Component
export { CometChatMessageListComponent } from './cometchat-message-list.component';

// Types
export type { MessageListItem } from './cometchat-message-list.component';

// Service (re-export from services for convenience)
export { MessageListService } from '../../services/message-list.service';

// Enums (re-export from Enums for convenience)
export { States, MessageListAlignment, MessageBubbleAlignment } from '../../Enums/Enums';

// Types and Interfaces (re-export from their original locations)
export type { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
export { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
export { CometChatOption } from '../../modals/CometChatOption';
