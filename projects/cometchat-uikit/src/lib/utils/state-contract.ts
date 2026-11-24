/**
 * State-contract identifiers (offline plan TEST-PLAN §3.3): the values the
 * offline conformance runners read from the DOM. They ship in release builds,
 * carry no message text and are never read by screen readers (they are
 * `data-*` attributes only, not accessibility labels).
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { isOutboxFailed, isSending, serverIdOf } from './offline/identity';
import { OfflineHub } from './offline/offline-hub';

export type ContractMessageState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** The row's send/receipt state, on either path. */
export function contractMessageState(message: CometChat.BaseMessage): ContractMessageState {
  const metadata: any = (message as any)?.getMetadata?.();
  if (isOutboxFailed(message) || (metadata && metadata.error) || (message as any)?.error || OfflineHub.getInstance().directFailureOf(message) !== undefined) return 'failed';
  if (serverIdOf(message) === 0 || isSending(message)) return 'sending';
  if (message.getReadAt?.()) return 'read';
  if (message.getDeliveredAt?.()) return 'delivered';
  return 'sent';
}

/** The server id as the contract carries it: empty while the row has none. */
export function contractServerId(message: CometChat.BaseMessage): string {
  const id = serverIdOf(message);
  return id ? String(id) : '';
}
