/*
 * Public API Surface of cometchat-uikit
 */

export * from './lib/cometchat-uikit';
export * from './lib/UIKitSettings';
export * from './lib/constants';

// Localization
export * from './lib/resources/CometChatLocalize';

// Modals/Interfaces
export * from './lib/modals';

// Interfaces (ConversationSlots, etc.)
export * from './lib/interfaces';

// Enums (includes Placement)
export * from './lib/Enums/Enums';
export { CometChatUIKitCalls } from './lib/CometChatCalls';
// Services
export * from './lib/services';

// Events
export { CometChatConversationEvents } from './lib/events/CometChatConversationEvents';

export { CometChatMessageEvents } from './lib/events/CometChatMessageEvents';
export type { IMessages, ICardActionEvent } from './lib/events/CometChatMessageEvents';
export { CometChatCallEvents } from './lib/events/CometChatCallEvents';
export { CometChatGroupEvents } from './lib/events/CometChatGroupEvents';
export type {
  IGroupMemberJoined,
  IGroupLeft,
  IGroupMemberAdded,
  IGroupMemberScopeChanged,
  IGroupMemberKickedBanned,
  IGroupMemberUnBanned,
  IOwnershipChanged,
} from './lib/events/CometChatGroupEvents';
export { CometChatUserEvents } from './lib/events/CometChatUserEvents';
export { CometChatUIEvents } from './lib/events/CometChatUIEvents';
export type {
  IActiveChatChanged,
  IOpenChat,
  IPanel,
  IModal,
  IDialog,
  IShowOngoingCall,
  IMouseEvent,
  IMentionsCountWarning,
} from './lib/events/CometChatUIEvents';

// Components
export * from './lib/components';

// Text Formatters
export * from './lib/formatters';

// Logger
export { CometChatLogger, LogLevel } from './lib/utils/CometChatLogger';

// Effect utility — Angular 18–21 compatible signal-write-safe effect wrapper
export { safeEffect } from './lib/utils/safe-effect';
export type { SafeEffectOptions } from './lib/utils/safe-effect';
