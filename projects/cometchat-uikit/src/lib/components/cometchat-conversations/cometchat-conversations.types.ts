/**
 * Types and interfaces for CometChatConversations component.
 *
 * Extracted from cometchat-conversations.component.ts to keep the
 * component class focused on UI logic while this file owns all type definitions.
 */

export { SelectionMode, States, Placement } from '../../Enums/Enums';
export { CometChatOption } from '../../modals/CometChatOption';
export type { SelectionState } from '../../modals/SelectionState';
export type { GlobalConfig } from '../../services/global-config.service';
export type { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
export type { ConversationSlots } from '../../interfaces/conversation-slots.interface';

import { CometChat } from '@cometchat/chat-sdk-javascript';
import { SelectionMode } from '../../Enums/Enums';

// ==================== Selection Types ====================

/**
 * Payload emitted by the `select` output.
 */
export interface ConversationSelectPayload {
  conversation: CometChat.Conversation;
  selected: boolean;
}

/**
 * Context object for conversation item templates.
 */
export interface ConversationItemContext {
  $implicit: CometChat.Conversation;
}

// ==================== Delete Dialog State ====================

/**
 * State for the delete conversation confirmation dialog.
 */
export interface DeleteConversationDialogState {
  isOpen: boolean;
  conversation: CometChat.Conversation | null;
}

// ==================== Sound Notification Types ====================

/**
 * Describes a sound notification event for a new message.
 */
export interface SoundNotificationEvent {
  message: CometChat.BaseMessage;
  conversation: CometChat.Conversation;
}

// ==================== Constants ====================

/**
 * Debounce delay for search input (ms).
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Selection mode type alias for clarity.
 */
export type ConversationSelectionMode = SelectionMode;
