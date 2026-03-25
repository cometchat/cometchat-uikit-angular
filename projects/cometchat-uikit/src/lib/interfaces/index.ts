/**
 * Public API for CometChat UIKit interfaces
 *
 * This module exports all shared interfaces used across the UIKit components.
 */

// Conversation slot interfaces for granular customization
export type { ConversationSlotContext, ConversationSlots } from './conversation-slots.interface';

// Message list interfaces for MessageListService configuration and callbacks
// Note: ErrorCallback is exported from services/message-composer.service.ts to avoid duplication
export type {
  MessageListConfig,
  FetchResult,
  MessageUpdatePayload,
} from './message-list.interfaces';
