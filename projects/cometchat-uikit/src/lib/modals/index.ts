/**
 * Public API for CometChat UIKit modals/interfaces
 */

// Base action class
export { CometChatActions } from './CometChatActions';

// Action interfaces
export { CometChatActionsIcon } from './CometChatActionsIcon';
export { CometChatActionsView } from './CometChatActionsView';
export { CometChatMessageComposerAction } from './CometChatMessageComposerAction';
export { CometChatOption } from './CometChatOption';


// Emoji interfaces
export type { CometChatEmoji, CometChatEmojiCategory } from './CometChatEmoji';

// UIKit result interfaces
export type { InitResult, LogoutResult } from './CometChatUIKitInterfaces';

// Media attachment interfaces
export type { MediaAttachment, MediaLayoutType } from './MediaAttachment';

// Audio attachment interfaces
export type { AudioAttachment, AudioState } from './AudioAttachment';

// Selection state interface for list components
export type { SelectionState } from './SelectionState';


// AI Assistant Tools model class
export { CometChatAIAssistantTools } from './CometChatAIAssistantTools';

// Note: CalendarObject is exported from CometChatLocalize (localization.interfaces.ts)
