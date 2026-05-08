/**
 * Mention utilities for CometChatMessageComposer component.
 *
 * Extracted from cometchat-message-composer.component.ts to isolate
 * mention trigger detection, suggestion scrolling, and mention count logic.
 */

import { MENTIONS_LIMIT } from './cometchat-message-composer.types';

// ==================== Trigger Detection ====================

/**
 * Checks whether the text at the cursor position contains a mention trigger (@).
 *
 * Returns the search text after the @ if a trigger is active, or null if not.
 *
 * @param text - Full text content of the composer
 * @param cursorPos - Current cursor position in the text
 */
export function detectMentionTrigger(text: string, cursorPos: number): string | null {
  if (!text || cursorPos <= 0) return null;

  const textBeforeCursor = text.slice(0, cursorPos);
  // Find the last @ before the cursor that isn't preceded by a word character
  const match = textBeforeCursor.match(/(?:^|[\s\n])@([^\s@]*)$/);
  if (!match) return null;

  return match[1]; // The search text after @
}

/**
 * Checks whether the cursor is currently inside a mention trigger context.
 */
export function isMentionTriggerActive(text: string, cursorPos: number): boolean {
  return detectMentionTrigger(text, cursorPos) !== null;
}

// ==================== Mention Count ====================

/**
 * Counts the number of unique mention UIDs in the current editor content.
 *
 * @param mentionUids - Set of unique UIDs currently mentioned
 */
export function getMentionCount(mentionUids: Set<string>): number {
  return mentionUids.size;
}

/**
 * Checks whether the mentions limit has been reached.
 *
 * @param mentionUids - Set of unique UIDs currently mentioned
 * @param newUid - The UID being considered for insertion
 */
export function isMentionLimitReached(mentionUids: Set<string>, newUid: string): boolean {
  // If the UID is already mentioned, it doesn't count as a new mention
  if (mentionUids.has(newUid)) return false;
  return mentionUids.size >= MENTIONS_LIMIT;
}

// ==================== Suggestion List Scrolling ====================

/**
 * Scrolls the mention suggestion at the given index into view within the container.
 *
 * @param container - The scrollable suggestions list element
 * @param index - The index of the suggestion to scroll into view
 */
export function scrollMentionSuggestionIntoView(
  container: HTMLElement | null | undefined,
  index: number
): void {
  if (!container) return;
  const items = container.querySelectorAll('[data-mention-index]');
  const item = items[index] as HTMLElement | undefined;
  if (item) {
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

// ==================== Mention Replacement ====================

/**
 * Calculates how many characters to delete when inserting a mention.
 * This covers the "@searchText" portion that triggered the suggestion.
 *
 * @param text - Full text content
 * @param cursorPos - Current cursor position
 */
export function getMentionCharsToDelete(text: string, cursorPos: number): number {
  const textBeforeCursor = text.slice(0, cursorPos);
  const match = textBeforeCursor.match(/(?:^|[\s\n])(@[^\s@]*)$/);
  if (!match) return 0;
  return match[1].length; // Length of "@searchText"
}
