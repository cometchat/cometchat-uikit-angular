/**
 * The one send helper for every own send on the offline (ON) path: composer
 * text, media, voice notes, drag-and-drop, stickers, the staged attachment
 * batch, and the `CometChatUIKit.send*` statics.
 *
 * It sends with the SDK's three-phase `MessageSentListener` (the form the SDK
 * queues offline) and reports each transition to the {@link OfflineHub}, which
 * draws the row and emits the public events exactly once. Callers read the gate
 * themselves when the user taps send and call this only when it said "on"; with
 * offline off they keep today's Promise-form path untouched.
 *
 * UI state never waits on the SDK's Promise: offline it rejects for a queued
 * send, and a send destroyed by logout may never settle (SDK ask A3): the kit settles it itself on
 * the session end, as Android does.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { merge, Observable, Subscription } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { CometChatLogger } from '../CometChatLogger';
import { OfflineCallback, offlineSdk, sdkConnected } from './offline-gate';
import {
  failureReasonOf,
  localIdOf,
  OFFLINE_MESSAGE_DISCARDED_CODE,
  OfflineFailureReason,
  serverIdOf,
  statusOf,
  OfflineMessageStatus,
} from './identity';
import { conversationIdOf, OfflineHub } from './offline-hub';
import { isNotConnectedError } from './reconcile';

export type OfflineSendKind = 'text' | 'media' | 'custom' | 'interactive';

/** How the send stands once the SDK has answered the first time. */
export interface OfflineSendResult {
  /** `sending` = accepted and queued: the row keeps the clock; not a failure. */
  state: 'sent' | 'sending' | 'failed';
  message: CometChat.BaseMessage;
  error?: unknown;
  reason?: string;
  /** Failed without entering the outbox; Retry is a fresh send. */
  direct?: boolean;
  /** Failed only because the session ended (logout or user switch): nothing to report to the user. */
  quiet?: boolean;
  /**
   * Only with `handOffAtPending`: the send's own answer once there is one (`sent` or `failed`), for a
   * caller that moved on at pending. Never resolves if the send is never answered (logout).
   */
  final?: Promise<OfflineSendResult>;
}

export interface OfflineSendOptions {
  /**
   * Answer as soon as the SDK holds the message (pending) instead of waiting for its first real
   * answer. A staged batch sends this way, as Android does: the outbox keeps the order, and a send
   * queued behind an unsent message of its chat would otherwise hold the next file for the bound.
   */
  handOffAtPending?: boolean;
}

/** Which SDK send a message goes through. */
export function sendKindOf(message: CometChat.BaseMessage): OfflineSendKind {
  const category = message?.getCategory?.();
  if (category === 'custom') return 'custom';
  if (category === 'interactive') return 'interactive';
  return message?.getType?.() === 'text' ? 'text' : 'media';
}

/**
 * SDK error codes that stand for a `MessageFailureReason`. The outbox refuses a
 * send because the queue is full with Android's code, which every SDK shares,
 * not with the reason itself: the per-send `onError` gets
 * `{ code: 'ERROR_PENDING_QUEUE_LIMIT' }` (the SDK's `OFFLINE_MESSAGE_ERROR.PENDING_QUEUE_LIMIT`).
 */
const REASON_BY_ERROR_CODE: Readonly<Record<string, string>> = Object.freeze({
  ERROR_PENDING_QUEUE_LIMIT: OfflineFailureReason.queueFull,
});

/** The `MessageFailureReason` carried by a per-send `onError`, if any. */
export function failureReasonFromError(error: unknown, reasonArg?: unknown): string {
  const candidates = [
    reasonArg,
    (error as any)?.reason,
    (error as any)?.code,
    (error as any)?.details?.reason,
  ];
  const known = Object.values(OfflineFailureReason) as string[];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && known.includes(candidate)) return candidate;
  }
  const code = (error as any)?.code;
  return (typeof code === 'string' && REASON_BY_ERROR_CODE[code]) || '';
}

function isRefusal(reason: string): boolean {
  return reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
}

function sdkSender(kind: OfflineSendKind): (message: any, listener: any) => unknown {
  const sdk = offlineSdk();
  switch (kind) {
    case 'media':
      return (m, l) => sdk.sendMediaMessage(m, l);
    case 'custom':
      return (m, l) => sdk.sendCustomMessage(m, l);
    case 'interactive':
      return (m, l) => sdk.sendInteractiveMessage(m, l);
    default:
      return (m, l) => sdk.sendMessage(m, l);
  }
}

/** How long a send the SDK accepted while connected may go unanswered before the composer moves on. */
export const QUEUED_ANSWER_WAIT_MS = 15_000;

function makeSentListener(handlers: {
  onMessagePending: OfflineCallback;
  onMessageSent: OfflineCallback;
  onError: OfflineCallback;
}): any {
  const Listener = offlineSdk().MessageSentListener;
  return typeof Listener === 'function' ? new Listener(handlers) : handlers;
}

/**
 * Send `message` on the offline path. Resolves once the SDK has answered the
 * first time (sent, queued, or failed); never rejects. Later transitions of a
 * queued send arrive through the hub's outbox bridge.
 */
export function sendWithState(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind,
  options: OfflineSendOptions = {}
): Promise<OfflineSendResult> {
  const hub = OfflineHub.getInstance();
  return new Promise<OfflineSendResult>(resolve => {
    let pendingMessage: CometChat.BaseMessage | null = null;
    let settled = false;
    let resolveFinal: (result: OfflineSendResult) => void = () => undefined;
    const final = options.handOffAtPending
      ? new Promise<OfflineSendResult>(r => (resolveFinal = r))
      : undefined;
    // A logout or user switch ends every send still waiting for its answer, once and quietly
    // (Android OfflineSend.rejectOpenCalls): the composer and the awaiting caller must not hang.
    const sessionEnded = hub.sessionEnd$.pipe(take(1)).subscribe(() =>
      settle({
        state: 'failed',
        message: pendingMessage ?? message,
        error: Object.assign(new Error(OfflineFailureReason.discarded), {
          code: OFFLINE_MESSAGE_DISCARDED_CODE,
        }),
        reason: OfflineFailureReason.discarded,
        quiet: true,
      })
    );
    const settle = (result: OfflineSendResult) => {
      if (!settled) {
        settled = true;
        resolve(final && result.state === 'sending' ? { ...result, final } : result);
      }
      if (result.state !== 'sending') resolveFinal(result);
      // Only a caller still waiting for `final` needs the session end after its first answer.
      if (result.state !== 'sending' || !final) sessionEnded.unsubscribe();
    };

    const failDirect = (failed: CometChat.BaseMessage, error: unknown, reason: string) => {
      hub.reportSendState(failed, 'failed', { reason, direct: true });
      // The SDK reports one refusal twice (this callback, then the outbox
      // listener): the hub raises the notice once, whichever comes first.
      hub.raiseRefusalNotice(failed, reason);
      settle({ state: 'failed', message: failed, error, reason, direct: true });
    };

    const listener = makeSentListener({
      onMessagePending: (pending: CometChat.BaseMessage) => {
        pendingMessage = pending ?? message;
        hub.reportSendState(pendingMessage, 'sending', { announced: true });
        // A send waiting behind an unsent message of its chat gets no further
        // callback until it is sent or fails (SDK R77), so offline the composer
        // must not wait for one. Online it answers once its chat drains; the
        // bound keeps the composer from ever waiting on a send for good.
        const queued = { state: 'sending' as const, message: pendingMessage };
        if (options.handOffAtPending || !sdkConnected()) settle(queued);
        else setTimeout(() => settle(queued), QUEUED_ANSWER_WAIT_MS);
      },
      onMessageSent: (sent: CometChat.BaseMessage) => {
        hub.reportSendState(sent, 'sent');
        settle({ state: 'sent', message: sent });
      },
      onError: (error: unknown, reasonArg?: unknown) => {
        const reason = failureReasonFromError(error, reasonArg);
        if (!pendingMessage) {
          // No pending callback came first: the SDK never queued it (BEH-SEND-33).
          failDirect(message, error, reason);
          return;
        }
        if (isRefusal(reason)) {
          // iOS fires pending before refusing a full queue (A7); treat it the same everywhere.
          failDirect(pendingMessage, error, reason);
          return;
        }
        if (statusOf(pendingMessage) === OfflineMessageStatus.failed) {
          // A server refusal arrives here as the raw server error, which carries
          // no MessageFailureReason: the SDK has already stamped the row with
          // one (PERMANENT), so read it off the row rather than publish a
          // failure with no reason. The global onOutboxMessageFailed that
          // carries the same reason comes later and is dropped as not new, so
          // this is the only chance to report it.
          const failed = reason || failureReasonOf(pendingMessage);
          hub.reportSendState(pendingMessage, 'failed', { reason: failed });
          settle({ state: 'failed', message: pendingMessage, error, reason: failed });
          return;
        }
        // Queued, not failed (BEH-SEND-10): the row keeps the clock and the
        // outbox reports the final state.
        settle({ state: 'sending', message: pendingMessage, error, reason });
      },
    });

    try {
      const result: any = sdkSender(kind)(message, listener);
      // The SDK settles its Promise as well; offline it rejects for a queued send.
      if (result && typeof result.then === 'function')
        result.then(undefined, () => {
          /* the per-send listener carries the outcome */
        });
    } catch (error) {
      CometChatLogger.error('OfflineSend', 'SDK send threw:', error);
      if (!pendingMessage) failDirect(message, error, failureReasonFromError(error));
    }
  });
}

/** A cache reset that lost the outbox: any pending count but a known 0 (BEH-ENC-15). */
function outboxLost$(hub: OfflineHub): Observable<unknown> {
  return hub.cacheReset$.pipe(filter(event => event.pendingMessagesLost !== 0));
}

/**
 * A removal: a logout or user switch, a cache reset that lost the outbox, the user's
 * Delete of the unsent row, or an outbox `DISCARDED` / `QUEUE_OVERFLOW`.
 *
 * `message` stays the sentence and the row travels as `sentMessage`. Assigning the
 * `BaseMessage` over `Error.message` left `catch (e) { e.message }` holding an object
 * instead of text. The code is always `ERROR_OFFLINE_MESSAGE_DISCARDED`, never the raw
 * reason behind the removal, so `isQuietRejection` (identity.ts) recognises every one of them.
 */
function discardedError(message: CometChat.BaseMessage | undefined, why: string): Error {
  return Object.assign(new Error(why), {
    code: OFFLINE_MESSAGE_DISCARDED_CODE,
    sentMessage: message,
  });
}

/** A real send failure: the reason is both the sentence and the code, as the offline-off path does. */
function sendFailure(reason: string | undefined, message: CometChat.BaseMessage): Error {
  return Object.assign(new Error(reason || 'Message send failed'), {
    code: reason,
    sentMessage: message,
  });
}

/**
 * The Promise contract of the public `CometChatUIKit.send*` statics on the ON
 * path: resolves when the message is sent, rejects on a final failure or a
 * direct error, never rejects because it was queued, and rejects (ERROR_OFFLINE_MESSAGE_DISCARDED) when a
 * cache reset loses the outbox or the session ends first.
 *
 * The session end and the outbox-lost reset are watched from the start, not
 * from the SDK's first answer: that answer can take up to
 * {@link QUEUED_ANSWER_WAIT_MS} for a send queued while connected, and
 * `cacheReset$` does not replay. A queued send with no local id cannot be
 * matched to the outbox, so only those two can settle it.
 */
export function sendWithStatePromise(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind
): Promise<CometChat.BaseMessage> {
  const hub = OfflineHub.getInstance();
  return new Promise<CometChat.BaseMessage>((resolve, reject) => {
    const subscriptions = new Subscription();
    let done = false;
    let latest: CometChat.BaseMessage = message;
    const finish = (settleWith: () => void) => {
      if (done) return;
      done = true;
      subscriptions.unsubscribe();
      settleWith();
    };
    const discarded = () =>
      finish(() => reject(discardedError(latest, OfflineFailureReason.discarded)));
    // A logout or user switch rejects it once, quietly, as on Android.
    subscriptions.add(hub.sessionEnd$.pipe(take(1)).subscribe(discarded));
    // A cache reset that lost the outbox took this message with it.
    subscriptions.add(outboxLost$(hub).pipe(take(1)).subscribe(discarded));

    sendWithState(message, kind).then(result => {
      if (done) return;
      if (result.state === 'sent') return finish(() => resolve(result.message));
      if (result.state === 'failed')
        return finish(() => reject(result.error ?? new Error(result.reason || 'Message send failed')));
      latest = result.message;
      const localMessageId = localIdOf(result.message);
      // No local id to match the outbox by: the session end or a reset settles it.
      if (!localMessageId) return;
      subscriptions.add(
        hub.sendState$
          .pipe(
            filter(event => event.localMessageId === localMessageId && event.state !== 'sending'),
            take(1)
          )
          .subscribe(event =>
            finish(() => {
              if (event.state === 'sent') resolve(event.message);
              // A removal is not a send failure: the user's Delete of the unsent row, or an
              // outbox DISCARDED / QUEUE_OVERFLOW, rejects with the documented
              // ERROR_OFFLINE_MESSAGE_DISCARDED rather than with the raw reason as its code.
              else if (event.state === 'discarded')
                reject(discardedError(event.message, OfflineFailureReason.discarded));
              else reject(sendFailure(event.reason, event.message));
            })
          )
      );
    });
  });
}

/**
 * Revoke local preview URLs of a queued or failed media send once it is sent
 * or removed (or the session ends), not while its bubble still shows them.
 */
export function revokeWhenSettled(
  message: CometChat.BaseMessage,
  urls: (string | null | undefined)[]
): void {
  const toRevoke = urls.filter((url): url is string => typeof url === 'string' && url.length > 0);
  if (toRevoke.length === 0) return;
  let revoked = false;
  const revoke = () => {
    if (revoked) return;
    revoked = true;
    toRevoke.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* already gone */
      }
    });
  };
  const localMessageId = localIdOf(message);
  // A direct failure keeps its preview for the session, as its Retry re-sends the same file.
  if (!localMessageId) return;
  const hub = OfflineHub.getInstance();
  // Sent, removed, the session ended, or a reset lost the outbox: the preview is not shown any more.
  hub.sendState$
    .pipe(
      filter(
        event =>
          event.localMessageId === localMessageId &&
          (event.state === 'sent' || event.state === 'discarded')
      ),
      take(1),
      takeUntil(merge(hub.sessionEnd$, outboxLost$(hub)))
    )
    .subscribe({ next: revoke, complete: revoke });
}

/** The SDK's error code of a refused `retryMessage` / `discardLocalMessage`. */
export const OfflineOutboxError = Object.freeze({
  inFlight: 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT',
  notFound: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND',
  disabled: 'ERROR_OFFLINE_DISABLED',
});

function errorCodeOf(error: unknown): string {
  const code = (error as any)?.code ?? (error as any)?.name;
  return typeof code === 'string' ? code : '';
}

/** Retries handed over and not answered yet, by local id (or muid for a direct failure). */
const retriesInFlight = new Set<string>();

function retryKeyOf(message: CometChat.BaseMessage): string {
  return localIdOf(message) || `m:${message?.getMuid?.() ?? ''}`;
}

/** Whether a Retry of `message` is under way (further taps are ignored). */
export function isRetryInFlight(message: CometChat.BaseMessage | null | undefined): boolean {
  return !!message && retriesInFlight.has(retryKeyOf(message));
}

/** How a user's Retry ended, once the SDK answered. */
export type RetryOutcome =
  'handed-over' | 'ignored' | 'in-flight' | 'not-found' | 'disabled' | 'error';

/**
 * The SDK answered `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` to a Retry or Delete: the
 * message's send is under way and nothing changed (BEH-SEND-20/36). The user
 * gets the short "Sending... try again in a moment" notice (R162 / S73).
 */
function noticeSendInFlight(message: CometChat.BaseMessage): void {
  const hub = OfflineHub.getInstance();
  hub.notice$.next({
    gen: hub.gen,
    kind: 'send_in_flight',
    message,
    conversationId: conversationIdOf(message),
  });
}

/**
 * Retry an own unsent message on the user's tap (BEH-SEND-37 as rewritten by
 * R162): an outbox row (PENDING, SENDING, or FAILED with any reason) is retried
 * by the SDK (`retryMessage(localMessageId)`); one whose send is under way is
 * answered `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` and the "Sending..." notice is
 * raised. A direct failure is sent again as a fresh send through the one send
 * helper (the SDK stamps a new `localMessageId`). Taps while a retry is in
 * flight are ignored; the kit never retries by itself (UIK-SEND-07). Outcomes
 * reach the row through the hub.
 */
export async function retryFailedMessage(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind
): Promise<RetryOutcome> {
  const key = retryKeyOf(message);
  if (retriesInFlight.has(key)) return 'ignored';
  retriesInFlight.add(key);
  try {
    return await runRetry(message, kind);
  } finally {
    retriesInFlight.delete(key);
  }
}

async function runRetry(
  message: CometChat.BaseMessage,
  kind: OfflineSendKind
): Promise<RetryOutcome> {
  const hub = OfflineHub.getInstance();
  const sdk = offlineSdk();
  const localMessageId = localIdOf(message);
  const status = statusOf(message);
  // Only a failure the outbox does not hold is sent fresh; an outbox row, SENDING
  // included, is retried by the SDK (sending it again would queue a duplicate).
  const inOutbox =
    !!localMessageId &&
    hub.directFailureOf(message) === undefined &&
    (status === '' ||
      status === OfflineMessageStatus.failed ||
      status === OfflineMessageStatus.pending ||
      status === OfflineMessageStatus.sending);
  if (!inOutbox) {
    hub.clearDirectFailed(message);
    await sendWithState(message, kind);
    return 'handed-over';
  }
  if (typeof sdk.retryMessage !== 'function') return 'error';
  // The reason the row failed with, read before the `sending` below clears it, so a
  // refused retry can put the row back the way it was.
  const priorReason = hub.failureReasonOf(message);
  // A FAILED row goes back to PENDING at once, online or off. The SDK fires no pending
  // callback for a retry — `retryMessage`'s own listener carries only `onMessageSent`
  // and `onError` — so the kit reports it, exactly as Android does
  // (`OfflineSend.kt:227`: `markRetrying` then `reportSend(..., SENDING)`) and as the
  // React kit does. Without this the row keeps reading "Not sent. Tap to retry" while
  // the SDK already holds it queued. `failed -> sending` is a forward transition.
  hub.reportSendState(message, 'sending', { announced: false });
  try {
    await sdk.retryMessage(
      localMessageId,
      makeSentListener({
        onMessagePending: (pending: CometChat.BaseMessage) =>
          hub.reportSendState(pending ?? message, 'sending'),
        onMessageSent: (sent: CometChat.BaseMessage) => hub.reportSendState(sent, 'sent'),
        // Not connected: it stays queued. A final failure also reaches the
        // outbox listener, which reports it once.
        onError: () => {
          /* the Promise below carries the same answer */
        },
      })
    );
    return 'handed-over';
  } catch (error) {
    const code = errorCodeOf(error);
    if (code === OfflineOutboxError.disabled) {
      // Kill switch: the SDK dropped its outbox; the row becomes failed (direct)
      // and its next Retry is a fresh send (UIK-LIFE-03).
      hub.reportSendState(message, 'failed', { direct: true });
      return 'disabled';
    }
    if (code === OfflineOutboxError.notFound) {
      // The SDK no longer holds it: a sent row stays, any other is removed (as on Android).
      removeUnheld(message);
      return 'not-found';
    }
    if (code === OfflineOutboxError.inFlight) {
      // Its send is under way: nothing changed, and the user is told so.
      noticeSendInFlight(message);
      return 'in-flight';
    }
    // Not connected (the retry stays PENDING), or the store was busy.
    CometChatLogger.warn('OfflineSend', 'retryMessage did not complete:', error);
    // Offline the row stays queued, so the clock it got above is right. Any other
    // refusal (the store was unavailable) means nothing is queued, so the row goes
    // back to failed with the reason it had — unless the outbox listener already
    // reported its real outcome, which is a forward state and must not be undone.
    if (!isNotConnectedError(error) && hub.stateOf(localMessageId) === 'sending') {
      hub.reportSendState(message, 'failed', priorReason ? { reason: priorReason } : {});
    }
    return 'handed-over';
  }
}

/**
 * Retry or Delete answered `ERROR_OFFLINE_MESSAGE_NOT_FOUND`: the SDK no
 * longer holds the message (it was sent, or purged with its chat). A row with
 * a server id, or one already reported sent, is a sent message and stays; any
 * other row is removed at once like a discard, which also takes back a thread
 * reply's count. Returns whether the row was removed.
 */
export function removeUnheld(message: CometChat.BaseMessage): boolean {
  if (serverIdOf(message) > 0) return false;
  return OfflineHub.getInstance().reportSendState(message, 'discarded', {
    reason: OfflineFailureReason.discarded,
    byUser: true,
  });
}

/** How a user's Delete of an unsent message ended. */
export type DiscardOutcome =
  /** Removed (from the device and the screen, or from the screen only for a direct failure). */
  | 'removed'
  /** `ERROR_OFFLINE_MESSAGE_IN_FLIGHT`: its send already started; nothing changed and the "Sending..." notice is raised (R162). */
  | 'in-flight'
  /** `ERROR_OFFLINE_MESSAGE_NOT_FOUND`: the SDK no longer holds it (sent, or purged); nothing changed yet. */
  | 'not-found'
  /** `ERROR_OFFLINE_DISABLED`: the kill switch dropped the outbox; the row is now failed (direct). */
  | 'disabled'
  /** Any other refusal (store busy); nothing changed. */
  | 'error';

/**
 * Delete an own unsent message (BEH-SEND-36/37, R162). An outbox row (PENDING,
 * SENDING or FAILED) is discarded through the SDK's `discardLocalMessage` (durable,
 * device-only, works offline); on success the SDK fires no outbox event, so
 * the hub reports the removal itself. A direct failure has no stored row and
 * is removed from the screen only. NOT_FOUND is left to the caller, which
 * knows whether the row on screen was sent ({@link removeUnheld}).
 */
export async function discardUnsentMessage(
  message: CometChat.BaseMessage
): Promise<DiscardOutcome> {
  const hub = OfflineHub.getInstance();
  const sdk = offlineSdk();
  const localMessageId = localIdOf(message);
  const inOutbox = !!localMessageId && hub.directFailureOf(message) === undefined;
  if (inOutbox) {
    if (typeof sdk.discardLocalMessage !== 'function') return 'error';
    try {
      await sdk.discardLocalMessage(localMessageId);
    } catch (error) {
      const code = errorCodeOf(error);
      CometChatLogger.warn('OfflineSend', 'discardLocalMessage refused:', error);
      if (code === OfflineOutboxError.inFlight) {
        noticeSendInFlight(message);
        return 'in-flight';
      }
      if (code === OfflineOutboxError.notFound) return 'not-found';
      if (code === OfflineOutboxError.disabled) {
        // The kill switch already dropped it from the outbox: it is a failed
        // (direct) row now, and Delete of such a row removes it from the screen.
        hub.reportSendState(message, 'failed', { direct: true });
        hub.reportSendState(message, 'discarded', {
          reason: OfflineFailureReason.discarded,
          byUser: true,
        });
        return 'disabled';
      }
      return 'error';
    }
  }
  hub.clearDirectFailed(message);
  hub.reportSendState(message, 'discarded', {
    reason: OfflineFailureReason.discarded,
    byUser: true,
  });
  return 'removed';
}
