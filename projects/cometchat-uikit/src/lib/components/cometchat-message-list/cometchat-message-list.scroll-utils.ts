/**
 * Scroll utilities for CometChatMessageList component.
 *
 * Extracted from cometchat-message-list.component.ts to isolate
 * scroll position management, sticky date logic, and scroll-to-message helpers.
 */

import { SCROLL_BOTTOM_THRESHOLD, ScrollPosition } from './cometchat-message-list.types';

// ==================== Scroll Position Helpers ====================

/**
 * Saves the current scroll position of a container element.
 */
export function saveScrollPosition(container: HTMLElement): ScrollPosition {
  return {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
  };
}

/**
 * Restores a previously saved scroll position after content is prepended.
 * Adjusts scrollTop to maintain the user's visual position.
 */
export function restoreScrollPosition(
  container: HTMLElement,
  saved: ScrollPosition
): void {
  const heightDiff = container.scrollHeight - saved.scrollHeight;
  container.scrollTop = saved.scrollTop + heightDiff;
}

/**
 * Checks whether the scroll container is at (or near) the bottom.
 *
 * @param container - The scrollable element
 * @param threshold - Distance from bottom in px to consider "at bottom"
 */
export function isScrolledToBottom(
  container: HTMLElement,
  threshold = SCROLL_BOTTOM_THRESHOLD
): boolean {
  const distanceFromBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceFromBottom <= threshold;
}

/**
 * Scrolls the container to the bottom.
 *
 * @param container - The scrollable element
 * @param smooth - Whether to use smooth scrolling
 */
export function scrollToBottom(container: HTMLElement, smooth = false): void {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

// ==================== Scroll-to-Message Helpers ====================

/**
 * Finds the DOM element for a message by its ID.
 *
 * @param container - The list container element
 * @param messageId - The message ID to find
 */
export function findMessageElement(
  container: HTMLElement,
  messageId: string | number
): Element | null {
  return container.querySelector(`[data-message-id="${messageId}"]`);
}

/**
 * Scrolls a message element into view and applies a highlight animation.
 *
 * @param element - The message DOM element
 * @param highlightClass - CSS class to apply for highlight effect
 * @param highlightDuration - Duration of highlight in ms
 */
export function highlightAndScrollToElement(
  element: Element,
  highlightClass = 'cometchat-message-list__message--highlighted',
  highlightDuration = 2000
): void {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add(highlightClass);
  setTimeout(() => element.classList.remove(highlightClass), highlightDuration);
}

// ==================== Sticky Date Helpers ====================

/**
 * Determines which date separator should be shown as the sticky header
 * based on the current scroll position.
 *
 * @param container - The scrollable list container
 * @param dateSeparatorSelector - CSS selector for date separator elements
 */
export function getStickyDateFromScroll(
  container: HTMLElement,
  dateSeparatorSelector = '[data-date-separator]'
): number | null {
  const separators = Array.from(
    container.querySelectorAll<HTMLElement>(dateSeparatorSelector)
  );

  if (separators.length === 0) return null;

  const containerTop = container.getBoundingClientRect().top;
  let stickyDate: number | null = null;

  for (const sep of separators) {
    const rect = sep.getBoundingClientRect();
    if (rect.top - containerTop <= 0) {
      const dateAttr = sep.getAttribute('data-date-separator');
      if (dateAttr) stickyDate = Number(dateAttr);
    } else {
      break;
    }
  }

  return stickyDate;
}

// ==================== Retry Scroll Helpers ====================

/**
 * Attempts to scroll to the bottom with retries, waiting for content to render.
 *
 * @param container - The scrollable element
 * @param retries - Number of retry attempts remaining
 * @param delayMs - Delay between retries in ms
 * @param smooth - Whether to use smooth scrolling
 */
export function scrollToBottomWithRetry(
  container: HTMLElement,
  retries: number,
  delayMs = 100,
  smooth = false
): void {
  scrollToBottom(container, smooth);
  if (retries > 0) {
    setTimeout(
      () => scrollToBottomWithRetry(container, retries - 1, delayMs, smooth),
      delayMs
    );
  }
}
