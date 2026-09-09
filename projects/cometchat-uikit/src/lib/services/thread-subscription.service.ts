import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatThreadEvents } from '../events/CometChatThreadEvents';
import { CometChatToastService } from '../components/base-elements/cometchat-toast/cometchat-toast.service';
import { CometChatLogger } from '../utils/CometChatLogger';
import {
  getSubscriptionTargetId,
  readThreadSubscribed,
  toThreadId,
  writeThreadSubscribed,
} from '../utils/thread-subscription-utils';

/** Minimum gap between two accepted toggles of the same thread. */
const TOGGLE_DEBOUNCE_MS = 400;

/** A thread the user was removed from, or whose parent message no longer exists. */
const ERR_MESSAGE_NO_ACCESS = 'ERR_MESSAGE_NO_ACCESS';
const ERR_MESSAGE_ID_NOT_FOUND = 'ERR_MESSAGE_ID_NOT_FOUND';

/** Arguments for {@link ThreadSubscriptionService.applyIncomingReply}. */
export interface IncomingReplySubscriptionArgs {
  /** The reply that just arrived over the socket. */
  reply: CometChat.BaseMessage;
  /**
   * The thread's parent message, when the surface holds it (a thread view). Its
   * `isThreadSubscribed()` is the authoritative state to inherit. Absent in the
   * main list, where the reply is not displayed.
   */
  parentMessage?: CometChat.BaseMessage | null;
  /** Logged-in user's uid, for the mention / own-message checks. */
  loggedInUserUid: string;
}

/**
 * Owns the follow/unfollow behaviour shared by the two subscription surfaces —
 * the thread header control and the message action sheet.
 *
 * The message object is the single source of truth: the server stamps its
 * per-viewer flag onto every fetched message in a thread, and the kit reads it
 * with `isThreadSubscribed()`. There is deliberately **no** kit-side cache — the
 * SDK removed the store this service used to read, and reintroducing one here
 * would repeat the mistake. What this service owns instead is the write path
 * (the in-flight lock, the throttle, the optimistic publish and the revert) plus
 * the local mirroring of the two state changes the client can observe without a
 * refetch.
 */
@Injectable({ providedIn: 'root' })
export class ThreadSubscriptionService implements OnDestroy {
  /** Optional so the service still works when no toast host is available (e.g. SSR, tests). */
  private readonly toast: CometChatToastService | null = (() => {
    try {
      return inject(CometChatToastService);
    } catch {
      return null;
    }
  })();

  /** Ids with a request on the wire — at most one per thread. */
  private readonly inFlight = new Set<number>();
  /**
   * Last accepted toggle per thread, for the throttle.
   *
   * Pruned on every write (below) so it only ever holds threads toggled within
   * the window — in practice one or two entries. Without that it would gain a
   * permanent entry per thread touched and never shrink.
   */
  private readonly lastToggleAt = new Map<number, number>();
  /** Threads the server answered 403/404 for: the control hides rather than lying. */
  private readonly unavailable = new Set<number>();

  /**
   * Bumped on every login/logout. A response that comes back carrying a stale
   * epoch is dropped rather than acted on — the surfaces that would hear the
   * publish belong to the previous session, and their state must not leak into
   * the next one.
   */
  private sessionEpoch = 0;

  private readonly sessionSubscription: Subscription;

  constructor() {
    this.sessionSubscription = CometChatUIKit.loggedInUser$.subscribe(() => this.resetSession());
  }

  /**
   * Whether the linked Chat SDK exposes the thread-subscription WRITE API. The
   * kit's peer range still admits SDK builds that predate it, and calling a
   * method that isn't there throws synchronously rather than rejecting — so both
   * surfaces ask this before rendering, and an app on an older SDK simply sees
   * no control instead of a button that throws.
   *
   * The state accessors are deliberately not part of the probe: they are read
   * off the message and guarded at their own call sites, and what a *control*
   * needs before it will render is the ability to actually change the state.
   */
  isSupported(): boolean {
    return (
      typeof CometChat.subscribeToThread === 'function' &&
      typeof CometChat.unsubscribeFromThread === 'function'
    );
  }

  // ==================== State ====================

  /**
   * Whether to render the followed affordance for a message's thread.
   *
   * Reads the flag off the message itself — every fetched message in a thread
   * carries it, so a reply bubble answers for its own thread without consulting
   * the parent.
   */
  isFollowing(message: CometChat.BaseMessage | null | undefined): boolean {
    return readThreadSubscribed(message);
  }

  /** True once the server has said this thread is gone or off-limits. */
  isUnavailable(parentMessageId: number): boolean {
    return this.unavailable.has(toThreadId(parentMessageId));
  }

  // ==================== Toggle ====================

  /**
   * Flip the subscription for a thread — the only path that writes to the
   * server.
   *
   * The write leaves on the **first** tap; a tap within
   * {@link TOGGLE_DEBOUNCE_MS} of it, or while its request is still on the wire,
   * is swallowed whole — no publish, no request, nothing queued. That keeps an
   * impatient double-tap from racing without deferring the request the user
   * actually asked for, and it is the same guard the React UI Kit applies, so a
   * double-tap lands on the same state on both platforms.
   *
   * @param message the message acted on. A reply resolves to its parent thread.
   * @returns the state the control should be left in.
   */
  toggle(message: CometChat.BaseMessage): boolean {
    const parentMessageId = getSubscriptionTargetId(message);
    const current = readThreadSubscribed(message);
    if (!parentMessageId || this.unavailable.has(parentMessageId) || !this.isSupported()) {
      return current;
    }

    const now = Date.now();
    this.pruneToggleStamps(now);
    const last = this.lastToggleAt.get(parentMessageId) ?? 0;
    if (this.inFlight.has(parentMessageId) || now - last < TOGGLE_DEBOUNCE_MS) {
      // A swallowed tap changes nothing, so the control stays where the user
      // sees it — the state the accepted toggle already put it in.
      return current;
    }

    this.lastToggleAt.set(parentMessageId, now);
    this.inFlight.add(parentMessageId);

    const subscribe = !current;
    // Optimistic: the surfaces flip now and stamp their held copies, so the next
    // read of this same message already answers `subscribe`.
    this.publish(parentMessageId, subscribe);
    void this.send(parentMessageId, subscribe);

    return subscribe;
  }

  /** Drop stamps older than the window; they can no longer swallow anything. */
  private pruneToggleStamps(now: number): void {
    for (const [id, at] of this.lastToggleAt) {
      if (now - at >= TOGGLE_DEBOUNCE_MS) this.lastToggleAt.delete(id);
    }
  }

  /**
   * Write the flip to the server and reconcile. Both calls are idempotent
   * server-side, so a duplicate never surfaces an error.
   */
  private async send(parentMessageId: number, subscribe: boolean): Promise<void> {
    const epoch = this.sessionEpoch;
    try {
      if (subscribe) {
        await CometChat.subscribeToThread(parentMessageId);
      } else {
        await CometChat.unsubscribeFromThread(parentMessageId);
      }
      if (epoch !== this.sessionEpoch) return;
      // Confirm what changed in both directions — the icon alone is a subtle
      // signal for something that governs whether the user hears about replies.
      this.toast?.info(
        CometChatLocalize.getLocalizedString(
          subscribe
            ? 'thread_subscription_subscribed_toast'
            : 'thread_subscription_unsubscribed_toast'
        )
      );
    } catch (error) {
      // The toast tells the user to try again, so let them: the throttle exists
      // to swallow an impatient double-tap, not a deliberate retry.
      this.lastToggleAt.delete(parentMessageId);
      if (epoch !== this.sessionEpoch) return;
      // The server was never written, so the control must not claim otherwise:
      // publishing the reverse both flips the surfaces back and re-stamps the
      // message objects they hold.
      this.publish(parentMessageId, !subscribe);
      this.handleError(parentMessageId, error as CometChat.CometChatException);
    } finally {
      this.inFlight.delete(parentMessageId);
    }
  }

  private handleError(parentMessageId: number, error: CometChat.CometChatException): void {
    const code = String(error?.code ?? '');
    const gone = code === ERR_MESSAGE_NO_ACCESS || code === ERR_MESSAGE_ID_NOT_FOUND;
    if (gone) {
      // The thread is off-limits or deleted; a retry cannot help, so stop
      // offering the control instead of leaving a button that always fails.
      this.unavailable.add(parentMessageId);
    }
    this.toast?.error(
      CometChatLocalize.getLocalizedString(gone ? 'thread_unavailable' : 'thread_subscription_failed')
    );
    CometChatLogger.error('ThreadSubscriptionService', 'Failed to update thread subscription:', error);
  }

  // ==================== Local mirrors ====================

  /**
   * Mirror an auto-subscribe the server already performed — Case 3 (a reply
   * mentions you) and Case 4 (you reply in a thread).
   *
   * Both are server-side truths, so this deliberately does NOT call
   * `subscribeToThread`: re-issuing the write would be a redundant round-trip,
   * and the next fetch of the thread confirms the state anyway. All this does is
   * give the open surfaces immediate feedback.
   */
  mirrorSubscribed(parentMessageId: number, capturedSession?: number): void {
    // A caller that awaited before getting here hands back the token it captured
    // first. Without it, a send that resolves after a logout would publish into
    // the next user's session and mark a thread they do not follow as followed —
    // the same hazard `send()` guards against with its own epoch check.
    if (capturedSession !== undefined && capturedSession !== this.sessionEpoch) return;
    const threadId = toThreadId(parentMessageId);
    if (!threadId) return;
    this.publish(threadId, true);
  }

  /**
   * A token for the current session.
   *
   * Capture it before an await and hand it back to {@link mirrorSubscribed}, so
   * a mirror belonging to a session that has since ended is dropped rather than
   * acted on. Callers that publish synchronously do not need it.
   */
  captureSession(): number {
    return this.sessionEpoch;
  }

  /**
   * Reconcile subscription state when a thread reply arrives in real time.
   *
   * A socket-delivered message reads `false` regardless of the truth — the flag
   * is only populated on responses to fetches that asked for it — so the reply's
   * own value can't be trusted. This resolves it:
   *
   * - **A reply from someone else that @mentions me** subscribes me server-side.
   *   Stamp `true` onto the reply and onto the held parent, and publish the flip
   *   so every mounted surface agrees.
   * - **Any other reply** doesn't change the subscription, so — when we hold the
   *   parent — inherit the thread's current state onto the reply, correcting the
   *   socket `false`. In the main list (no parent held) the reply isn't
   *   displayed, so there is nothing to stamp.
   *
   * A no-op on anything that isn't a thread reply, so calling it on every
   * received message is safe.
   */
  applyIncomingReply({ reply, parentMessage, loggedInUserUid }: IncomingReplySubscriptionArgs): void {
    const parentId = toThreadId(
      typeof reply?.getParentMessageId === 'function' ? reply.getParentMessageId() : 0
    );
    if (!parentId) return;

    const senderUid = typeof reply.getSender === 'function' ? reply.getSender()?.getUid() : '';
    const fromSomeoneElse = !!senderUid && senderUid !== loggedInUserUid;
    const mentioned =
      (typeof reply.getMentionedUsers === 'function' ? reply.getMentionedUsers() : []) ?? [];
    const mentionsMe = fromSomeoneElse && mentioned.some(user => user.getUid() === loggedInUserUid);

    if (mentionsMe) {
      writeThreadSubscribed(reply, true);
      writeThreadSubscribed(parentMessage, true);
      this.mirrorSubscribed(parentId);
      return;
    }

    if (parentMessage) {
      writeThreadSubscribed(reply, readThreadSubscribed(parentMessage));
    }
  }

  // ==================== Bus ====================

  private publish(parentMessageId: number, subscribed: boolean): void {
    CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId, subscribed });
  }

  /**
   * Login or logout ends the session: a response still on the wire is dropped
   * rather than acted on, and the guards start clean so the next user is not
   * throttled by the previous one's taps.
   */
  private resetSession(): void {
    this.sessionEpoch++;
    this.lastToggleAt.clear();
    this.inFlight.clear();
    this.unavailable.clear();
  }

  ngOnDestroy(): void {
    this.sessionSubscription.unsubscribe();
  }
}
