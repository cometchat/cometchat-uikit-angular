/**
 * Utility functions for CometChatReactions component.
 */

/**
 * Calculates the maximum number of visible emojis based on available width.
 * Each emoji pill occupies approximately 46px. Result is clamped between 1 and 100.
 */
export function getMaxVisibleEmojis(availableWidth: number): number {
  return Math.min(100, Math.max(1, Math.floor(availableWidth / 46)));
}
