/**
 * Types and interfaces for CometChatMessageList component.
 *
 * Extracted from cometchat-message-list.component.ts to keep the
 * component class focused on UI logic while this file owns all type definitions.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== List Item Types ====================

/**
 * Represents an item in the message list.
 * Can be either a message or a date separator.
 */
export interface MessageListItem {
  /** Type of the item */
  type: 'message' | 'date-separator';
  /** The message object (only for type 'message') */
  message?: CometChat.BaseMessage;
  /** The date timestamp (only for type 'date-separator') */
  date?: number;
  /** Unique key for tracking */
  key: string;
}

// ==================== Scroll State Types ====================

/**
 * Saved scroll position for restoration after content changes.
 */
export interface ScrollPosition {
  scrollTop: number;
  scrollHeight: number;
}

/**
 * Result of a scroll-to-bottom check.
 */
export interface ScrollBottomState {
  isAtBottom: boolean;
  distanceFromBottom: number;
}

// ==================== Translation State Types ====================

/**
 * Tracks the translation state for a single message.
 */
export interface MessageTranslationState {
  isTranslating: boolean;
  translatedText?: string;
  language?: string;
}

// ==================== Delete/Flag Dialog Types ====================

/**
 * State for the delete confirmation dialog.
 */
export interface DeleteDialogState {
  isOpen: boolean;
  message: CometChat.BaseMessage | null;
}

/**
 * State for the flag/report confirmation dialog.
 */
export interface FlagDialogState {
  isOpen: boolean;
  message: CometChat.BaseMessage | null;
}

// ==================== Emoji Keyboard Position Types ====================

/**
 * Position coordinates for the emoji keyboard popup.
 */
export interface EmojiKeyboardPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// ==================== Constants ====================

/**
 * Threshold in pixels from the bottom to consider the list "at bottom".
 */
export const SCROLL_BOTTOM_THRESHOLD = 50;

/**
 * Number of retries for scroll-to-bottom after content load.
 */
export const SCROLL_RETRY_COUNT = 3;

/**
 * Delay between scroll retries in ms.
 */
export const SCROLL_RETRY_DELAY_MS = 100;

/**
 * Debounce delay for scroll event handling in ms.
 */
export const SCROLL_DEBOUNCE_MS = 100;
