/**
 * Which actions an own unsent message offers on the offline (ON) path.
 *
 * Ruling R162 / S73 (frozen 2026-11-03) rewrote SDK rule BEH-SEND-37 and
 * supersedes the earlier "Copy, no Delete" text of BEH-SEND-37 / UIK-SEND-05:
 * a UI Kit offers Retry and Delete on every own `PENDING`, `SENDING` and
 * `FAILED` (any reason) message, and on a failed (direct) one kept in memory
 * (BEH-SEND-33).
 *
 * | Row                                              | Retry | Delete |
 * |--------------------------------------------------|-------|--------|
 * | `PENDING`                                         | yes   | yes    |
 * | `SENDING`                                         | yes   | yes    |
 * | `FAILED` (any reason, or none: R95)               | yes   | yes    |
 * | failed (direct), kept in memory (BEH-SEND-33)     | yes   | yes    |
 *
 * The kit does not guess which of them can work: on a message whose send is
 * under way the SDK answers `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` to either and
 * changes nothing, and the kit shows the short "Sending... try again in a
 * moment" notice (see `send.ts`).
 *
 * Nothing that needs a server id is offered on an unsent row: no reply, thread,
 * react, edit, pin, save, mark-unread, info, translate, report or forward. Copy
 * is not offered either (the kit's choice; R162 does not mention it).
 *
 * Never consulted with offline off.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { isOfflineOn } from './offline-gate';
import { localIdOf, OfflineMessageStatus, serverIdOf, statusOf } from './identity';
import { OfflineHub } from './offline-hub';

export interface UnsentActions {
  retry: boolean;
  delete: boolean;
}

const NONE: UnsentActions = Object.freeze({ retry: false, delete: false });
const BOTH: UnsentActions = Object.freeze({ retry: true, delete: true });

/**
 * The actions an own message offers because it has not been sent, or `null`
 * when it has been sent (it keeps today's full menu).
 */
export function unsentActionsOf(
  message: CometChat.BaseMessage | null | undefined
): UnsentActions | null {
  if (!message) return null;
  const hub = OfflineHub.getInstance();
  if (hub.directFailureOf(message) !== undefined) return BOTH;
  const status = statusOf(message);
  if (
    status === OfflineMessageStatus.pending ||
    status === OfflineMessageStatus.sending ||
    status === OfflineMessageStatus.failed
  ) {
    return BOTH;
  }
  if (serverIdOf(message) > 0) return null;
  // No status yet and no server id: a row the hub has seen fail or send gets both;
  // the composer's optimistic row before the SDK's pending callback has neither a
  // local handle nor anything to retry or delete yet.
  const local = localIdOf(message);
  const last = local ? hub.stateOf(local) : undefined;
  if (last === 'failed' || last === 'sending') return BOTH;
  return NONE;
}

/**
 * Whether this message is drawn with its unsent state: on the offline path, or
 * when the kill switch left it failed (direct) with offline now off, where its
 * Retry is a fresh send (UIK-LIFE-03). Only the offline path makes a direct failure.
 */
export function drawsUnsentState(message: CometChat.BaseMessage | null | undefined): boolean {
  return isOfflineOn() || OfflineHub.getInstance().directFailureOf(message) !== undefined;
}

/** Whether the message is FAILED (outbox or direct), for the failed rendering. */
export function isFailedUnsent(message: CometChat.BaseMessage | null | undefined): boolean {
  if (!message) return false;
  if (OfflineHub.getInstance().directFailureOf(message) !== undefined) return true;
  return statusOf(message) === OfflineMessageStatus.failed;
}
