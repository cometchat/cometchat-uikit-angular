import { DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * Payload of {@link CometChatThreadEvents.ccThreadSubscriptionChanged}.
 */
export interface IThreadSubscriptionChanged {
  /** The root message id of the thread whose state changed. */
  parentMessageId: number;
  /** Whether the logged-in user now follows the thread. */
  subscribed: boolean;
}

/**
 * Thread event subjects, the channel that keeps the two subscription surfaces —
 * the thread header control and the message action sheet — in agreement without
 * a refetch.
 *
 * The two surfaces are separate components that can be alive at the same time
 * (the action sheet on the parent message in the main list, the header inside
 * the open thread). Both publish here on toggle and both listen here, so
 * following from one flips the other on the next change-detection pass.
 *
 * This is the *only* channel: the Chat SDK no longer emits subscription events,
 * so everything on this subject originates in the kit — a manual toggle, its
 * revert on failure, or a mirror of an auto-subscribe the server performed (a
 * reply that mentions the user, or the user replying in the thread). A
 * subscriber's job on a matching id is to re-render *and* to stamp the flag onto
 * the message objects it holds, so the source of truth stays coherent.
 *
 * This is also the channel an integrator's own thread list should subscribe to:
 * the UI Kit ships no threads list, so an app that builds one against
 * `CometChat.ThreadsRequest` needs a way to learn that a row was followed or
 * unfollowed from one of our surfaces. Note that unfollowing hard-deletes the
 * row server-side, so a list must remove it rather than re-render it.
 */
export class CometChatThreadEvents {
  /** Emitted whenever this client's view of a thread's subscription changes. */
  static ccThreadSubscriptionChanged = new Subject<IThreadSubscriptionChanged>();

  // ── Typed Publish Methods ──

  static publishThreadSubscriptionChanged(data: IThreadSubscriptionChanged): void {
    CometChatThreadEvents.ccThreadSubscriptionChanged.next(data);
  }

  // ── Typed Subscribe Helpers ──

  static onThreadSubscriptionChanged(
    cb: (data: IThreadSubscriptionChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatThreadEvents.ccThreadSubscriptionChanged,
      cb,
      destroyRef
    );
  }
}
