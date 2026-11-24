/**
 * Offline support: a "Connect to load more" footer loads on scroll once the
 * connection is back, as well as on tap (UIK-READ-03, UIT-READ-03).
 *
 * The user scrolled to an end of the list offline and the read stopped there.
 * The scroll observers (IntersectionObserver) only report a change, and the
 * sentinel at that end is still in view, so they never fire again; scrolling
 * could not load. While the footer shows and the connection is back, the next
 * scroll gesture at that end loads instead. At most one read per second, so a
 * burst of wheel or scroll events makes one. Attached only while the footer is
 * retryable, so a list with offline off adds no listener.
 *
 * @internal
 */

/** The least time between two loads a scroll gesture at a "Connect to load" footer starts. */
export const RETRY_ON_SCROLL_GAP_MS = 1000;

/** How close to the top counts as "at the top" (the top observer's own margin). */
export const RETRY_ON_SCROLL_TOP_REACH_PX = 100;

/** The events that mean "the user is scrolling". */
const SCROLL_INTENT_EVENTS = ['wheel', 'touchmove', 'scroll', 'keydown'] as const;

/** What the retry needs from the message list. */
export interface RetryOnScrollHost {
  listContainer?: { nativeElement: HTMLElement } | null;
  isFetchingPrevious(): boolean;
  isFetchingNext(): boolean;
  hasMoreNext(): boolean;
  readonly BOTTOM_THRESHOLD: number;
  handleScrollToTop(): void | Promise<void>;
  handleScrollToBottom(): void;
}

/** Which way a scroll gesture points, when the event says (wheel, keys). */
export function scrollDirectionOf(event: Event): 'up' | 'down' | undefined {
  if (event.type === 'wheel') {
    const { deltaY } = event as WheelEvent;
    return deltaY < 0 ? 'up' : deltaY > 0 ? 'down' : undefined;
  }
  if (event.type === 'keydown') {
    const { key } = event as KeyboardEvent;
    if (key === 'ArrowUp' || key === 'PageUp' || key === 'Home') return 'up';
    if (key === 'ArrowDown' || key === 'PageDown' || key === 'End') return 'down';
  }
  return undefined;
}

/** Listen for scroll gestures on the list and load at the end they reach. Returns the detach function. */
export function attachRetryOnScroll(host: RetryOnScrollHost): () => void {
  const container = host.listContainer?.nativeElement;
  if (!container) return () => undefined;
  let lastAttempt = -Infinity;
  const onScrollIntent = (event: Event): void => {
    if (host.isFetchingPrevious() || host.isFetchingNext()) return;
    const direction = scrollDirectionOf(event);
    // Only the keys that scroll; typing in a row's controls is not a scroll.
    if (event.type === 'keydown' && direction === undefined) return;
    // One read per gesture: a scroll or wheel burst fires many events.
    const now = Date.now();
    if (now - lastAttempt < RETRY_ON_SCROLL_GAP_MS) return;
    const atTop = container.scrollTop <= RETRY_ON_SCROLL_TOP_REACH_PX;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < host.BOTTOM_THRESHOLD;
    if (atTop && direction !== 'down') {
      lastAttempt = now;
      void host.handleScrollToTop();
    } else if (atBottom && direction !== 'up' && host.hasMoreNext()) {
      lastAttempt = now;
      host.handleScrollToBottom();
    }
  };
  for (const type of SCROLL_INTENT_EVENTS)
    container.addEventListener(type, onScrollIntent, { passive: true });
  return () => {
    for (const type of SCROLL_INTENT_EVENTS) container.removeEventListener(type, onScrollIntent);
  };
}
