/**
 * Keyboard navigation helpers for CometChatConversations component.
 *
 * Extracted from cometchat-conversations.component.ts to isolate
 * keyboard navigation, focus management, and selection keyboard logic.
 */

import { ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Focus Navigation ====================

/**
 * Moves focus to the next conversation item, wrapping at the end.
 * Returns the new focusedIndex.
 */
export function focusNextConversationItem(
  conversationList: CometChat.Conversation[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (conversationList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) {
    newIndex = 0;
  } else if (focusedIndex < conversationList.length - 1) {
    newIndex = focusedIndex + 1;
  } else {
    newIndex = 0;
  }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Moves focus to the previous conversation item, wrapping at the start.
 * Returns the new focusedIndex.
 */
export function focusPreviousConversationItem(
  conversationList: CometChat.Conversation[],
  focusedIndex: number,
  cdr: ChangeDetectorRef,
  scrollFocusedItemIntoView: () => void
): number {
  if (conversationList.length === 0) return focusedIndex;
  let newIndex: number;
  if (focusedIndex === -1) {
    newIndex = conversationList.length - 1;
  } else if (focusedIndex > 0) {
    newIndex = focusedIndex - 1;
  } else {
    newIndex = conversationList.length - 1;
  }
  cdr.markForCheck();
  scrollFocusedItemIntoView();
  return newIndex;
}

/**
 * Scrolls the focused conversation item into view.
 */
export function scrollConversationItemIntoView(
  listContainer: HTMLElement | undefined,
  focusedIndex: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(
    setTimeout(() => {
      if (!listContainer) return;
      const el = listContainer.querySelector(`[data-index="${focusedIndex}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, 0)
  );
}

/**
 * Focuses the DOM element for the conversation item at the given index.
 */
export function focusConversationItemAtIndex(
  listContainer: HTMLElement | undefined,
  index: number,
  pendingTimers: ReturnType<typeof setTimeout>[]
): void {
  pendingTimers.push(
    setTimeout(() => {
      if (!listContainer) return;
      const el = listContainer.querySelector(`[data-index="${index}"]`);
      if (el) {
        const focusable = el.querySelector('[tabindex="0"]') as HTMLElement;
        if (focusable) focusable.focus();
      }
    }, 0)
  );
}

// ==================== Selection Range ====================

/**
 * Extends the selection range from a start index to an end index.
 * Returns the updated selected set.
 */
export function extendConversationSelectionTo(
  conversationList: CometChat.Conversation[],
  selectedConversations: Set<string>,
  startIndex: number,
  endIndex: number
): Set<string> {
  const updated = new Set(selectedConversations);
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  for (let i = minIndex; i <= maxIndex; i++) {
    const conv = conversationList[i];
    if (conv) {
      const id = getConversationKey(conv);
      updated.add(id);
    }
  }
  return updated;
}

// ==================== Helpers ====================

/**
 * Returns a stable key for a conversation (used as Map/Set key).
 */
export function getConversationKey(conversation: CometChat.Conversation): string {
  return conversation.getConversationId();
}
