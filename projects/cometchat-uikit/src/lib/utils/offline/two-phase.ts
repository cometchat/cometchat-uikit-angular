/**
 * Generic two-phase `fetchNext(listener)` for the snapshot lists (users,
 * groups, group members, banned members, reactions, notification feed,
 * threads, and the pinned/saved/history message lists) on the offline (ON) path: cached page, then server page, then
 * exactly one terminal. Never used with offline off.
 *
 * @internal
 */
import { OfflineCallback, offlineSdk } from './offline-gate';
import { isNotConnectedError } from './reconcile';

/** The SDK's listener class and callback suffix for each list kind. */
const LIST_KINDS = {
  users: { listener: 'UserFetchListener', suffix: 'Users' },
  groups: { listener: 'GroupFetchListener', suffix: 'Groups' },
  groupMembers: { listener: 'GroupMemberFetchListener', suffix: 'GroupMembers' },
  bannedMembers: { listener: 'BannedMemberFetchListener', suffix: 'BannedGroupMembers' },
  reactions: { listener: 'ReactionFetchListener', suffix: 'Reactions' },
  notificationFeed: { listener: 'NotificationFeedFetchListener', suffix: 'NotificationFeedItems' },
  threads: { listener: 'ThreadFetchListener', suffix: 'Threads' },
  conversations: { listener: 'ConversationFetchListener', suffix: 'Conversations' },
  /** Pinned / saved / AI-history message requests (`MessagesRequest`, read with `fetchPrevious`). */
  messages: { listener: 'MessageFetchListener', suffix: 'Messages' },
} as const;

export type TwoPhaseListKind = keyof typeof LIST_KINDS;

export interface TwoPhaseHandlers<T> {
  onCached(page: T[]): void;
  onServer(page: T[]): void;
  /** `notConnected` = an offline read past the cache; keep what is shown. */
  onError(error: unknown, notConnected: boolean): void;
}

export function fetchNextTwoPhase<T>(
  request: {
    fetchNext(listener?: any): Promise<unknown>;
    fetchPrevious?(listener?: any): Promise<unknown>;
  },
  kind: TwoPhaseListKind,
  handlers: TwoPhaseHandlers<T>,
  /** `previous` for requests read newest-first with `fetchPrevious` (pinned, saved, AI history). */
  direction: 'next' | 'previous' = 'next'
): Promise<void> {
  const { listener: listenerName, suffix } = LIST_KINDS[kind];
  return new Promise<void>(resolve => {
    let settled = false;
    const end = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    const callbacks: Record<string, OfflineCallback> = {
      [`onCached${suffix}`]: (page: T[]) => {
        if (!settled) handlers.onCached(Array.isArray(page) ? page : []);
      },
      [`onServer${suffix}`]: (page: T[]) => {
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
    const Listener = offlineSdk()[listenerName];
    const listener = typeof Listener === 'function' ? new Listener(callbacks) : callbacks;
    try {
      const result: any =
        direction === 'previous' ? request.fetchPrevious!(listener) : request.fetchNext(listener);
      // The listener is the channel. The SDK's Promise is a backstop so a read
      // can never hang (P6): a rejection ends it; a resolution with no server
      // callback by the next task is taken as the server page.
      if (result && typeof result.then === 'function') {
        result.then(
          (page: unknown) =>
            setTimeout(() => {
              if (!settled) callbacks[`onServer${suffix}`](Array.isArray(page) ? page : []);
            }, 0),
          (error: unknown) => callbacks['onError'](error)
        );
      }
    } catch (error) {
      callbacks['onError'](error);
    }
  });
}

/**
 * One two-phase page read for a list that shows rows as they arrive: `onCached`
 * paints the cached page; the promise settles with the server page. `server`
 * is `null` when the server could not be reached (an offline read past the
 * cache) and `unreachable` carries that not-connected error: the caller decides
 * whether the rows it shows stay (D83: nothing on screen is an error view).
 * Any other error rejects.
 */
export async function readPageTwoPhase<T>(
  request: {
    fetchNext(listener?: any): Promise<unknown>;
    fetchPrevious?(listener?: any): Promise<unknown>;
  },
  kind: TwoPhaseListKind,
  onCached: (page: T[]) => void,
  direction: 'next' | 'previous' = 'next'
): Promise<{ server: T[] | null; unreachable?: unknown }> {
  let server: T[] | null = null;
  let unreachable: unknown;
  let failure: { error: unknown } | null = null;
  await fetchNextTwoPhase<T>(
    request,
    kind,
    {
      onCached,
      onServer: page => {
        server = page;
      },
      onError: (error, notConnected) => {
        if (notConnected) unreachable = error;
        else failure = { error };
      },
    },
    direction
  );
  if (failure) throw (failure as { error: unknown }).error;
  return { server, unreachable };
}

/**
 * Apply a snapshot list's server page over what its cached page showed: the
 * slice the cached page painted is replaced by the server page, in the
 * server's order (so a newer row lands where the server puts it, not at the
 * end); cached rows the server no longer returns are dropped. Rows of other
 * pages stay where they are. With no overlap the page is appended (a "load
 * more" past what was shown).
 */
export function mergeSnapshotPage<T>(
  current: readonly T[],
  cachedKeys: ReadonlySet<string>,
  page: readonly T[],
  keyOf: (item: T) => string
): T[] {
  const pageKeys = new Set(page.map(keyOf));
  const inSlice = (item: T) => {
    const key = keyOf(item);
    return cachedKeys.has(key) || pageKeys.has(key);
  };
  const first = current.findIndex(inSlice);
  const before = (first === -1 ? current : current.slice(0, first)).filter(item => !inSlice(item));
  const after = first === -1 ? [] : current.slice(first).filter(item => !inSlice(item));
  const seen = new Set(before.map(keyOf));
  const slice: T[] = [];
  for (const item of page) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    slice.push(item);
  }
  const rest = after.filter(item => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...before, ...slice, ...rest];
}

/** The answer of a two-phase single read: the freshest copy and where it came from. */
export interface TwoPhaseSingle<T> {
  value: T | null;
  /** `server` once the server answered; `cache` when only the device copy was available. */
  from: 'server' | 'cache' | 'none';
  /** The error that ended the read, when the server did not answer. */
  error?: unknown;
}

/**
 * Two-phase `CometChat.getConversation(with, type, ConversationDetailsListener)`
 * (BEH-READ-32) for a chat opened by id (push tap, deep link, unread pivot):
 * `onCached` is called with the device copy when there is one (a hit only),
 * and the promise settles with the server copy, or with the device copy when
 * the server could not be reached. Never rejects: a never-cached chat offline
 * settles `{value: null, from: 'none', error}` and the caller keeps today's
 * error path. Offline path only; an SDK without the listener form falls back
 * to the Promise form.
 */
export function getConversationTwoPhase(
  conversationWith: string,
  conversationType: string,
  onCached?: (conversation: any) => void
): Promise<TwoPhaseSingle<any>> {
  const sdk = offlineSdk();
  return new Promise(resolve => {
    let cached: any = null;
    let settled = false;
    const end = (answer: TwoPhaseSingle<any>) => {
      if (!settled) {
        settled = true;
        resolve(answer);
      }
    };
    const fail = (error: unknown) =>
      end(cached ? { value: cached, from: 'cache', error } : { value: null, from: 'none', error });
    const Listener = sdk?.ConversationDetailsListener;
    if (typeof Listener !== 'function') {
      Promise.resolve()
        .then(() => sdk.getConversation(conversationWith, conversationType))
        .then(
          (conversation: any) =>
            end({ value: conversation ?? null, from: conversation ? 'server' : 'none' }),
          fail
        );
      return;
    }
    const listener = new Listener({
      onCachedConversation: (conversation: any) => {
        if (settled || !conversation) return;
        cached = conversation;
        try {
          onCached?.(conversation);
        } catch {
          /* the caller's paint must not end the read */
        }
      },
      onServerConversation: (conversation: any) =>
        end({
          value: conversation ?? cached,
          from: conversation ? 'server' : cached ? 'cache' : 'none',
        }),
      onError: (error: unknown) => fail(error),
    });
    try {
      const result: any = sdk.getConversation(conversationWith, conversationType, listener);
      // The SDK settles its Promise too (it rejects offline); whichever answers
      // first ends the read, so it can never hang.
      if (result && typeof result.then === 'function') {
        result.then(
          (conversation: any) =>
            end({
              value: conversation ?? cached,
              from: conversation ? 'server' : cached ? 'cache' : 'none',
            }),
          (error: unknown) => fail(error)
        );
      }
    } catch (error) {
      fail(error);
    }
  });
}

/**
 * Two-phase `CometChat.getMessageDetails(id, MessageDetailsListener)`
 * (BEH-READ-35) for the jump-to-message target: `onCached` gets the device copy
 * on a hit, and the promise settles with the server copy, or the device copy
 * when the server cannot be reached, or nothing. Never rejects and never hangs
 * (the SDK's Promise also ends it). Offline path only; an SDK without the
 * listener form falls back to the Promise form.
 */
export function getMessageDetailsTwoPhase(
  messageId: number | string,
  onCached?: (message: any) => void
): Promise<TwoPhaseSingle<any>> {
  const sdk = offlineSdk();
  return new Promise(resolve => {
    let cached: any = null;
    let settled = false;
    const end = (answer: TwoPhaseSingle<any>) => {
      if (!settled) {
        settled = true;
        resolve(answer);
      }
    };
    const fail = (error: unknown) =>
      end(cached ? { value: cached, from: 'cache', error } : { value: null, from: 'none', error });
    const fromServer = (message: any) =>
      end({ value: message ?? cached, from: message ? 'server' : cached ? 'cache' : 'none' });
    const Listener = sdk?.MessageDetailsListener;
    if (typeof Listener !== 'function') {
      Promise.resolve()
        .then(() => sdk.getMessageDetails(messageId))
        .then(fromServer, fail);
      return;
    }
    const listener = new Listener({
      onCachedMessage: (message: any) => {
        if (settled || !message) return;
        cached = message;
        try {
          onCached?.(message);
        } catch {
          /* the caller's paint must not end the read */
        }
      },
      onServerMessage: fromServer,
      onError: (error: unknown) => fail(error),
    });
    try {
      const result: any = sdk.getMessageDetails(messageId, listener);
      if (result && typeof result.then === 'function') result.then(fromServer, fail);
    } catch (error) {
      fail(error);
    }
  });
}
