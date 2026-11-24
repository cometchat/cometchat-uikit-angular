/**
 * The conversation list's offline (ON) path: two-phase reads, and the
 * reconcile of the SDK's catch-up sync page instead of a refetch on reconnect
 * (README §3.7, UIK-SYNC-04). Nothing here runs with offline off.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { offlineSdk } from '../utils/offline/offline-gate';
import { isUnsent } from '../utils/offline/identity';
import { isNotConnectedError } from '../utils/offline/reconcile';
import { dedupeConversations, getConversationEntityId } from './conversations.utils';

/** A row whose preview is an own message the server has not acked: never dropped by a read (BEH-CONV-06). */
export function hasUnsentPreview(conversation: CometChat.Conversation): boolean {
  const last = conversation.getLastMessage?.();
  return !!last && isUnsent(last as CometChat.BaseMessage);
}

function updatedAtOf(conversation: CometChat.Conversation): number {
  const value = Number(
    (conversation as any).getUpdatedAt?.() ??
      (conversation.getLastMessage?.() as any)?.getSentAt?.()
  );
  return Number.isFinite(value) ? value : 0;
}

/**
 * The timestamp the SERVER gave this row, or 0 when it has none.
 *
 * A row this device created from a live message
 * (`CometChatHelper.getConversationFromMessage`) has no `updatedAt` at all, so
 * it must not be mistaken for a server row with a recent one: only a row the
 * server has spoken about can be reconciled against what the server sends.
 */
function serverUpdatedAtOf(conversation: CometChat.Conversation): number {
  const value = Number((conversation as any).getUpdatedAt?.());
  return Number.isFinite(value) ? value : 0;
}

/**
 * How recent a row is, for ordering: the later of what the server said and the
 * row's own last message. A live message never bumps `updatedAt`, so ordering
 * on `updatedAt` alone left a chat that had just been written to sitting below
 * chats older than it.
 */
function recencyOf(conversation: CometChat.Conversation): number {
  const sentAt = Number((conversation.getLastMessage?.() as any)?.getSentAt?.());
  return Math.max(serverUpdatedAtOf(conversation), Number.isFinite(sentAt) ? sentAt : 0);
}

/** Newest first, by {@link recencyOf}. */
function byRecency(a: CometChat.Conversation, b: CometChat.Conversation): number {
  return recencyOf(b) - recencyOf(a);
}

/**
 * Apply a server page of the first page: the page's rows replace the cached
 * ones; a row the page no longer has is dropped, except one whose preview is
 * an own unsent message.
 */
export function applyFirstServerPage(
  current: CometChat.Conversation[],
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  const pageIds = new Set(page.map(getConversationEntityId));
  const keptUnsent = current.filter(
    c => !pageIds.has(getConversationEntityId(c)) && hasUnsentPreview(c)
  );
  return dedupeConversations([...keptUnsent, ...page]);
}

/**
 * Whether a request is the plain conversation list: no request at all, or one that
 * narrows nothing. What the request does decides, not whether the app passed a
 * builder: a builder that only sets a limit is plain. A request narrows with a
 * conversation type other than both, tags, user or group tags, a search keyword,
 * unread only or a pinned-by filter; hiding or showing only agentic chats also makes
 * it a list of its own. Anything but plain re-runs its own request on a sync page.
 */
export function isPlainConversationsRequest(
  request: CometChat.ConversationsRequest | undefined
): boolean {
  if (!request) return true;
  const r = request as any;
  const type = r.getConversationType?.();
  const filled = (list: unknown) => Array.isArray(list) && list.length > 0;
  return !(
    (typeof type === 'string' && type !== '' && type.toLowerCase() !== 'both') ||
    filled(r.getTags?.()) ||
    filled(r.getUserTags?.()) ||
    filled(r.getGroupTags?.()) ||
    !!r.getSearchKeyword?.() ||
    !!r.getUnread?.() ||
    filled(r.getPinnedBy?.()) ||
    !!r.getHideAgentic?.() ||
    !!r.getOnlyAgentic?.()
  );
}

/**
 * Merge a re-read first page (the resync of a filtered list) into the rows on screen
 * without cutting the list back to it: the page's rows replace or join theirs, and a
 * row below page one stays. Only a row in `prunable` (the ones this read's own cached
 * phase delivered) that the page no longer has is dropped, except one whose preview is
 * an own unsent message. An empty page removes nothing (D17).
 */
export function mergeFirstPage(
  current: CometChat.Conversation[],
  page: CometChat.Conversation[],
  prunable: ReadonlySet<string>
): CometChat.Conversation[] {
  if (page.length === 0) return current;
  const pageIds = new Set(page.map(getConversationEntityId));
  const byId = new Map(current.map(c => [getConversationEntityId(c), c] as const));
  const incoming = page.map(row => {
    const existing = byId.get(getConversationEntityId(row));
    // An own unsent preview is newer than anything the server has.
    return existing && hasUnsentPreview(existing) && updatedAtOf(existing) >= updatedAtOf(row)
      ? existing
      : row;
  });
  const rest = current.filter(c => {
    const id = getConversationEntityId(c);
    if (pageIds.has(id)) return false;
    return !prunable.has(id) || hasUnsentPreview(c);
  });
  return dedupeConversations([...incoming, ...rest].sort(byRecency));
}

/**
 * Keep a chat this device read while offline at zero unread (AC-7.4, D3 on #674).
 *
 * The SDK's conversation phase completes before the message phase whose
 * completion flushes the remembered read receipts, so a sync page still carries
 * the server's pre-read count and the badge comes back on a chat the user has
 * read. Rows the caller recognises as read on this device are pinned to zero
 * until a new message makes them unread for real.
 */
export function keepLocalReadsCleared(
  rows: CometChat.Conversation[],
  wasReadLocally: (entityId: string, conversationType: string) => boolean
): CometChat.Conversation[] {
  for (const row of rows) {
    if ((row.getUnreadMessageCount?.() ?? 0) === 0) continue;
    const type = String(row.getConversationType?.() ?? '');
    if (!type || !wasReadLocally(getConversationEntityId(row), type)) continue;
    row.setUnreadMessageCount?.(0);
  }
  return rows;
}

/**
 * Reconcile the slice one sync page covers on the plain, unfiltered list:
 * rows in the page are replaced or added; rows inside the page's range that
 * the page no longer has are removed (unless their preview is an own unsent
 * message); rows below the page are kept; nothing moves backwards.
 */
export function reconcileSyncPage(
  current: CometChat.Conversation[],
  page: CometChat.Conversation[]
): CometChat.Conversation[] {
  if (page.length === 0) return current;
  const pageIds = new Set(page.map(getConversationEntityId));
  const oldestInPage = Math.min(...page.map(updatedAtOf));
  const newestInPage = Math.max(...page.map(updatedAtOf));
  const byId = new Map(current.map(c => [getConversationEntityId(c), c] as const));
  const merged = page.map(incoming => {
    const existing = byId.get(getConversationEntityId(incoming));
    // An own unsent preview is newer than anything the server has.
    if (existing && hasUnsentPreview(existing) && updatedAtOf(existing) >= updatedAtOf(incoming))
      return existing;
    return incoming;
  });
  const rest = current.filter(c => {
    if (pageIds.has(getConversationEntityId(c))) return false;
    if (hasUnsentPreview(c)) return true;
    // A page is a snapshot of what the server knew when the sync was asked
    // for, so it can only account for rows the server has told this device
    // about. Dropping anything else loses a chat that arrived while the sync
    // was in flight - the SDK guards the same case with its dispatch-sequence
    // check (R156, SyncEngine.ts); this is the kit's copy of that rule.
    const serverAt = serverUpdatedAtOf(c);
    // No server timestamp: this device created the row from a live message.
    if (serverAt === 0) return true;
    // Below the page's range: the page never covered it (as before).
    if (serverAt < oldestInPage) return true;
    // Inside the range and absent from the page, so the server has moved on
    // from it - unless this device has since seen it move past everything the
    // page carries, which cannot have been in the snapshot.
    return recencyOf(c) >= newestInPage;
  });
  return dedupeConversations([...merged, ...rest].sort(byRecency));
}

export interface TwoPhaseConversationHandlers {
  onCached(page: CometChat.Conversation[]): void;
  onServer(page: CometChat.Conversation[]): void;
  /** `notConnected` = an offline read past the cache: keep what is shown. */
  onError(error: unknown, notConnected: boolean): void;
}

/** One two-phase `fetchNext(listener)`; exactly one of onServer / onError ends it. */
export function fetchConversationsTwoPhase(
  request: CometChat.ConversationsRequest,
  handlers: TwoPhaseConversationHandlers
): Promise<void> {
  return new Promise<void>(resolve => {
    let settled = false;
    const end = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    const callbacks = {
      onCachedConversations: (page: CometChat.Conversation[]) => {
        if (!settled) handlers.onCached(Array.isArray(page) ? page : []);
      },
      onServerConversations: (page: CometChat.Conversation[]) => {
        if (settled) return;
        handlers.onServer(Array.isArray(page) ? page : []);
        end();
      },
      onError: (error: unknown) => {
        if (settled) return;
        handlers.onError(error, isNotConnectedError(error));
        end();
      },
    };
    const Listener = offlineSdk().ConversationFetchListener;
    const listener = typeof Listener === 'function' ? new Listener(callbacks) : callbacks;
    try {
      const result: any = (request as any).fetchNext(listener);
      // The listener is the channel. The SDK's Promise is a backstop so a read
      // can never hang (P6), as in two-phase.ts: a rejection ends it; a
      // resolution with no server callback by the next task is taken as the
      // server page.
      if (result && typeof result.then === 'function')
        result.then(
          (page: unknown) =>
            setTimeout(() => {
              if (!settled) callbacks.onServerConversations(Array.isArray(page) ? page : []);
            }, 0),
          (error: unknown) => callbacks.onError(error)
        );
    } catch (error) {
      callbacks.onError(error);
    }
  });
}
