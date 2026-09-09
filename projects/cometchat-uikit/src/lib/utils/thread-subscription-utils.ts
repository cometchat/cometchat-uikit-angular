import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Pure helpers for reading and writing a thread's subscription flag.
 *
 * The message object is the single source of truth: the server stamps its
 * per-viewer flag onto every *fetched* message in a thread, and the kit mirrors
 * a change it learns of back onto the objects it holds. These live apart from
 * {@link ThreadSubscriptionService} so an option builder or a bubble can read
 * the flag without pulling the whole service graph in.
 */

/**
 * Normalize a thread id to a number.
 *
 * Load-bearing: the id arrives as a number from the typings but as a string from
 * some payloads, and bus subscribers match it with `===`. A string on one side
 * and a number on the other makes every cross-surface update silently no-op, so
 * everything that publishes or matches a thread id goes through here.
 *
 * @returns a positive integer id, or 0 for anything else.
 */
export function toThreadId(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Read the server's subscription flag off a message.
 *
 * The flag rides every *fetched* message in a thread — parent and replies alike
 * — and answers "does the viewer follow this message's thread". Reads `false`
 * when the accessor is missing or the message is partial, so building an option
 * list on every change-detection pass can never throw here.
 */
export function readThreadSubscribed(message: CometChat.BaseMessage | null | undefined): boolean {
  return !!(
    message &&
    typeof message.isThreadSubscribed === 'function' &&
    message.isThreadSubscribed()
  );
}

/**
 * Mirror a subscription state onto a message object the kit is holding.
 *
 * Purely local — the SDK setter never touches the server. It keeps a held copy
 * in step with a change learned elsewhere (an optimistic flip, or an
 * auto-subscribe mirror), so a direct read or a component remount sees the
 * current value between fetches. A no-op on an SDK build without the setter.
 */
export function writeThreadSubscribed(
  message: CometChat.BaseMessage | null | undefined,
  subscribed: boolean
): void {
  if (message && typeof message.setThreadSubscribed === 'function') {
    message.setThreadSubscribed(subscribed);
  }
}

/**
 * The thread a subscription action on this message refers to.
 *
 * On a top-level message that is the message itself — it is the thread's root.
 * On a reply it is the reply's PARENT, never the reply's own id. That
 * distinction is the whole safety property here: CometChat has no nested
 * threads, but the server has no guard either, so subscribing to a reply id
 * returns 200 and writes a row into the user's thread list pointing at a thread
 * that cannot be opened.
 *
 * Reads defensively: unlike the other options, which only touch the message
 * inside `onClick`, this one is resolved while the option list is being built,
 * so a caller passing a partial message must not take the whole list down.
 */
export function getSubscriptionTargetId(message: CometChat.BaseMessage): number {
  const rawParentId: unknown =
    typeof message?.getParentMessageId === 'function' ? message.getParentMessageId() : undefined;
  const rawId: unknown = typeof message?.getId === 'function' ? message.getId() : undefined;
  return toThreadId(rawParentId) || toThreadId(rawId);
}

/**
 * Write a subscription flip onto every held message belonging to one thread —
 * the parent and, in a thread view, each of its replies, since the server stamps
 * the flag on all of them and each bubble reads its own.
 *
 * This is what a surface does when the cross-surface event arrives: re-rendering
 * alone would draw against the pre-flip value, because the value lives on the
 * message rather than in a store.
 */
export function stampThreadSubscription(
  messages: Iterable<CometChat.BaseMessage | null | undefined>,
  parentMessageId: number,
  subscribed: boolean
): void {
  const threadId = toThreadId(parentMessageId);
  if (!threadId) return;
  for (const message of messages) {
    if (message && getSubscriptionTargetId(message) === threadId) {
      writeThreadSubscribed(message, subscribed);
    }
  }
}
