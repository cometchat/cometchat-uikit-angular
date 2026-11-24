/**
 * Row identity and send state for the offline (ON) path.
 *
 * None of these helpers is used with offline off: the OFF path keeps today's
 * id/muid matching exactly. Every SDK accessor here is feature-detected, because
 * the kit runs against SDKs that predate the offline release.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/** Message states the offline SDK reports through `getStatus()`. */
export const OfflineMessageStatus = Object.freeze({
  pending: 'PENDING',
  sending: 'SENDING',
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
});

/** Why a send failed (`MessageFailureReason`); identical on every SDK. */
export const OfflineFailureReason = Object.freeze({
  transient: 'TRANSIENT',
  permanent: 'PERMANENT',
  queueOverflow: 'QUEUE_OVERFLOW',
  queueFull: 'QUEUE_FULL',
  byteOverflow: 'BYTE_OVERFLOW',
  discarded: 'DISCARDED',
});

/** Error code of a quiet rejection (session end or cache reset); the same on Android, React and RN. */
export const OFFLINE_MESSAGE_DISCARDED_CODE = 'ERROR_OFFLINE_MESSAGE_DISCARDED';

/**
 * Whether an error is a quiet rejection the kit must not surface. Accepts the current code and the
 * old `DISCARDED` one.
 */
export function isQuietRejection(e: unknown): boolean {
  const code = (e as { code?: unknown } | null | undefined)?.code;
  return code === OFFLINE_MESSAGE_DISCARDED_CODE || code === OfflineFailureReason.discarded;
}

const CALL_CATEGORY = 'call';

function callIfFunction(target: any, name: string): any {
  try {
    const fn = target?.[name];
    return typeof fn === 'function' ? fn.call(target) : undefined;
  } catch {
    return undefined;
  }
}

/** The message's server id as a number; `0` until the server has acked it. */
export function serverIdOf(message: CometChat.BaseMessage | null | undefined): number {
  if (!message) return 0;
  const raw = callIfFunction(message, 'getId');
  const id = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

/**
 * The SDK's local handle for an own message. JS parses `localMessageId` only on
 * messages it created; a server-parsed copy carries it in `data.localMessageId`
 * (SDK ask A4), so fall back to that.
 */
export function localIdOf(message: CometChat.BaseMessage | null | undefined): string {
  if (!message) return '';
  const local = callIfFunction(message, 'getLocalMessageId');
  if (typeof local === 'string' && local) return local;
  const data = callIfFunction(message, 'getData') ?? (message as any).data;
  const fromData = data && typeof data === 'object' ? (data as any).localMessageId : undefined;
  return typeof fromData === 'string' && fromData ? fromData : '';
}

export function muidOf(message: CometChat.BaseMessage | null | undefined): string {
  if (!message) return '';
  const muid = callIfFunction(message, 'getMuid');
  return typeof muid === 'string' ? muid : '';
}

/**
 * The offline send state of a message, or `''` when it has none.
 *
 * `getStatus()` is `@private` in the 4.3 typings and `CometChat.Call` uses it
 * for the call status, so it is read feature-detected and never for a call
 * (SDK ask A11).
 */
export function statusOf(message: CometChat.BaseMessage | null | undefined): string {
  if (!message) return '';
  if (callIfFunction(message, 'getCategory') === CALL_CATEGORY) return '';
  const status = callIfFunction(message, 'getStatus');
  return typeof status === 'string' ? status : '';
}

/** The `MessageFailureReason` stamped on a FAILED message, or `''`. */
export function failureReasonOf(message: CometChat.BaseMessage | null | undefined): string {
  const reason = callIfFunction(message, 'getFailureReason');
  return typeof reason === 'string' ? reason : '';
}

/** Whether the message was delivered by the SDK's catch-up sweep (`source === 'SYNC'`). */
export function isSyncDelivered(message: CometChat.BaseMessage | null | undefined): boolean {
  return callIfFunction(message, 'getSource') === 'SYNC';
}

/** Not acked by the server yet: PENDING, SENDING or FAILED, or no server id. */
export function isUnsent(message: CometChat.BaseMessage | null | undefined): boolean {
  if (!message) return false;
  const status = statusOf(message);
  if (
    status === OfflineMessageStatus.pending ||
    status === OfflineMessageStatus.sending ||
    status === OfflineMessageStatus.failed
  ) {
    return true;
  }
  return serverIdOf(message) === 0 && (localIdOf(message) !== '' || muidOf(message) !== '');
}

/** PENDING or SENDING: on its way, shown with the clock. */
export function isSending(message: CometChat.BaseMessage | null | undefined): boolean {
  const status = statusOf(message);
  return status === OfflineMessageStatus.pending || status === OfflineMessageStatus.sending;
}

/** FAILED in the outbox (derived from `status`, so it survives a restart). */
export function isOutboxFailed(message: CometChat.BaseMessage | null | undefined): boolean {
  return statusOf(message) === OfflineMessageStatus.failed;
}

/**
 * The list key on the ON path: server id once there is one, then the local
 * handle, then the own muid.
 */
export function rowKey(message: CometChat.BaseMessage): string {
  const id = serverIdOf(message);
  if (id > 0) return `s:${id}`;
  const local = localIdOf(message);
  if (local) return `l:${local}`;
  return `m:${muidOf(message)}`;
}

/**
 * The render key on the ON path (README §3.2): an own message keeps one key from
 * compose to ack, so its bubble does not remount; another sender's message is
 * keyed by its server id only (other senders' muids can collide).
 */
export function renderKey(
  message: CometChat.BaseMessage,
  ownUid: string | null | undefined
): string {
  const id = serverIdOf(message);
  const senderUid = callIfFunction(callIfFunction(message, 'getSender'), 'getUid');
  // A row with no server id is always an own message the SDK has not sent yet.
  if (id > 0 && (!ownUid || senderUid !== ownUid)) return `s:${id}`;
  const local = localIdOf(message);
  if (local) return `l:${local}`;
  const muid = muidOf(message);
  return muid ? `m:${muid}` : `s:${id}`;
}
