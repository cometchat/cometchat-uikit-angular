/**
 * The message list's offline (ON) path. Every function here runs only after
 * the caller read `isOfflineOn()` as true for that operation; with offline off
 * the service keeps today's single fetch and merge.
 *
 * - Reads are two-phase: the cached page paints first, the server page then
 *   replaces the same slice in place (README §3.3).
 * - Own sends are drawn from the hub's send-state stream (§3.4).
 * - Reconnect makes no message fetch: the SDK's sweep is consumed, plus one
 *   newest-window refresh after a PARTIAL or failed sweep (§3.7).
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { WritableSignal } from '@angular/core';
import { CometChatLogger } from '../utils/CometChatLogger';
import { OfflineCallback, offlineSdk, sdkConnected } from '../utils/offline/offline-gate';
import { getMessageDetailsTwoPhase } from '../utils/offline/two-phase';
import {
  isSending,
  localIdOf,
  OfflineMessageStatus,
  serverIdOf,
  statusOf,
} from '../utils/offline/identity';
import {
  cachedKeysOf,
  dropUnjoinedCachedPage,
  findRowIndex,
  HeldReceipts,
  isNotConnectedError,
  newestServerId,
  oldestServerId,
  reconcileServerPage,
  removeRow,
  upsertSorted,
} from '../utils/offline/reconcile';
import {
  MessageSyncEvent,
  MessagesUpdatedEvent,
  OfflineHub,
  SendStateEvent,
} from '../utils/offline/offline-hub';
import { flushPendingSentMessages } from './message-list.sent-handler';
import { defaultListFilter, isClientFiltered } from './message-list.request-builder';
import { readThreadSubscribed, writeThreadSubscribed } from '../utils/thread-subscription-utils';

/**
 * Footer shown when an offline read could not go past the cache.
 *
 * @internal
 */
export type OfflineFooterState = 'none' | 'connect_to_load_more';

export interface OfflineListContext {
  messagesRequest: CometChat.MessagesRequest | null;
  nextMessagesRequest: CometChat.MessagesRequest | null;
  fetchGeneration: number;
  parentMessageId: number | null;
  isAgentChatMode: boolean;
  hideGroupActionMessages: boolean;
  errorCallback: ((error: CometChat.CometChatException) => void) | null;
  loadingStateSignal: WritableSignal<boolean>;
  errorStateSignal: WritableSignal<Error | null>;
  prevMessageIdSignal: WritableSignal<number>;
  nextMessageIdSignal: WritableSignal<number>;
  allMessagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messageIdMap: Map<number, CometChat.BaseMessage>;
  messageMuidMap: Map<string, CometChat.BaseMessage>;
  offlineFooterSignal: WritableSignal<OfflineFooterState>;
  /**
   * Set while the footer shows and the connection is back, so scrolling to that
   * end loads again, as tapping the footer does (UIK-READ-03). Cleared with the footer.
   */
  offlineFooterRetryableSignal?: WritableSignal<boolean>;
  /**
   * Set when the last older read refused offline had no cached row either: the
   * device has nothing older, so scrolling there waits for the connection
   * instead of issuing one refused read per scroll. Cleared by a server page.
   */
  offlinePreviousExhausted?: boolean;
  /**
   * Which edges an offline read could not go past, for the shown footer: a tap retries the older
   * edge, else the newer one (Android `retryLoadMore`). Reset whenever the footer clears.
   */
  offlineBlocked?: { previous: boolean; next: boolean };
  /** Bumped when a PARTIAL sweep's newest-window read replaced a non-overlapping list. */
  newestWindowResetSignal?: WritableSignal<number>;
  /**
   * D84: "Connect to load messages" is up (the error state, because the device was not connected), so
   * the first page is read once by itself when the connection is back. A non-network error never sets it.
   */
  offlineReloadOnConnect?: boolean;
  /**
   * D84 rule 5: a load the user or app started failed online while messages were on screen. The rows
   * stay and no error view shows; this is how the failure reaches the list's `onError`. Never called
   * for a not-connected failure (rule 2).
   */
  reportLoadError?(error: unknown): void;
  heldReceipts: HeldReceipts;
  /** Set once this list has run an ON-path operation; scopes session cleanup. */
  offlinePathUsed: boolean;
  /** Start checking for the kill switch at each connection event; idempotent. */
  watchConnection?(): void;
  normalizeMessageId(id: string | number): number;
  markInitialMessagesAsRead(): Promise<void>;
  buildMessagesRequest(messageId?: number): CometChat.MessagesRequest;
  buildNextMessagesRequest(messageId?: number): CometChat.MessagesRequest;
  clearMessagesAndState(): void;
  isMessageForCurrentConversation(message: CometChat.BaseMessage): boolean;
  /** Whether a swept row's type/category would show in this list (optional: absent accepts all). */
  acceptsSweptRow?(message: CometChat.BaseMessage): boolean;
  applyReceiptToMessage?(
    message: CometChat.BaseMessage,
    receipt: CometChat.MessageReceipt
  ): CometChat.BaseMessage;
}

/** This list drew something on the offline path: from now on it watches the connection (kill switch, reconnect reload). */
function markOfflinePathUsed(ctx: OfflineListContext): void {
  ctx.offlinePathUsed = true;
  ctx.watchConnection?.();
}

/** Replace the list's rows and keep the id/muid lookup maps in step. */
export function setRows(ctx: OfflineListContext, rows: CometChat.BaseMessage[]): void {
  ctx.allMessagesSignal.set(rows);
  ctx.messagesSignal.set(rows);
  ctx.messageIdMap.clear();
  ctx.messageMuidMap.clear();
  for (const row of rows) {
    const id = serverIdOf(row);
    if (id > 0) ctx.messageIdMap.set(id, row);
    const muid = row.getMuid?.();
    if (muid) ctx.messageMuidMap.set(muid, row);
  }
}

/** Cursors anchor on rows with a server id (never on an unsent row's 0). */
function updateCursors(ctx: OfflineListContext, rows: readonly CometChat.BaseMessage[]): void {
  const oldest = oldestServerId(rows);
  const newest = newestServerId(rows);
  if (oldest > 0) ctx.prevMessageIdSignal.set(oldest);
  if (newest > 0 && newest > ctx.nextMessageIdSignal()) {
    const hadNoCursor = ctx.nextMessageIdSignal() === 0;
    ctx.nextMessageIdSignal.set(newest);
    if (hadNoCursor) ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newest);
  }
}

/** Apply receipts that arrived before their message's ack. */
function applyHeldReceipts(
  ctx: OfflineListContext,
  rows: CometChat.BaseMessage[]
): CometChat.BaseMessage[] {
  if (ctx.heldReceipts.size === 0 || !ctx.applyReceiptToMessage) return rows;
  let next = rows;
  rows.forEach((row, index) => {
    const id = serverIdOf(row);
    const receipt = id > 0 ? ctx.heldReceipts.take(id) : undefined;
    if (receipt) {
      if (next === rows) next = rows.slice();
      next[index] = ctx.applyReceiptToMessage!(row, receipt);
    }
  });
  return next;
}

/** Upsert messages into sorted place (live, swept, cached or server copies). */
export function upsertOffline(
  ctx: OfflineListContext,
  messages: readonly CometChat.BaseMessage[]
): boolean {
  const result = upsertSorted(ctx.allMessagesSignal(), messages);
  if (!result.changed) return false;
  setRows(ctx, applyHeldReceipts(ctx, result.rows));
  updateCursors(ctx, result.rows);
  return true;
}

function makeFetchListener(handlers: {
  onCachedMessages: OfflineCallback;
  onServerMessages: OfflineCallback;
  onError: OfflineCallback;
}): any {
  const Listener = offlineSdk().MessageFetchListener;
  return typeof Listener === 'function' ? new Listener(handlers) : handlers;
}

interface TwoPhaseOptions {
  request: CometChat.MessagesRequest;
  direction: 'previous' | 'next';
  /** Called with the raw server page, and the rows of it the list shows, after they were applied. */
  onServerApplied?: (raw: CometChat.BaseMessage[], shown: CometChat.BaseMessage[]) => void;
  /**
   * The kit started this read itself (a sync event, not the user). A failure with rows shown
   * stays quiet: no error callback, no "Connect to load more" footer; the next reconnect retries.
   */
  automatic?: boolean;
  /**
   * D84 rule 5: a load the user or app started (open, jump, retry, paging) reaches `onError` once
   * when it fails online with rows shown; a not-connected failure never does (rule 2). Defaults to
   * true; a jump's second page passes false so the jump reports once.
   */
  report?: boolean;
}

/**
 * One two-phase page read. Resolves with "this direction has more": only a
 * non-empty server page says yes, and only an empty one, online, ends the list
 * (BEH-READ-09b). An offline read past the cache resolves `false` and shows the
 * "Connect to load more" footer instead of an error (the caller keeps the
 * direction open while the footer shows). Any other failure reports today's
 * error and resolves `true`: it does not say the chat has no more messages.
 *
 * On a client-filtered request "more" and the end of the list come from the raw
 * page, never the filtered count, and a page with no row to show reads on, or
 * the list would show its empty state or stop paging on a stretch of hidden rows.
 */
function twoPhasePage(ctx: OfflineListContext, options: TwoPhaseOptions): Promise<boolean> {
  markOfflinePathUsed(ctx);
  const generation = ctx.fetchGeneration;
  const stale = () => generation !== ctx.fetchGeneration;
  const isFirstFetch = ctx.prevMessageIdSignal() === 0 && ctx.nextMessageIdSignal() === 0;
  const reportsFailure = options.report ?? true;
  if (ctx.allMessagesSignal().length === 0) ctx.loadingStateSignal.set(true);
  const shows = isClientFiltered(options.request) ? defaultListFilter(ctx) : null;
  const shownOf = (page: CometChat.BaseMessage[]) => (shows ? page.filter(shows) : page);
  return new Promise<boolean>(resolve => {
    let settled = false;
    const finish = (hasMore: boolean) => {
      if (!settled) {
        settled = true;
        resolve(hasMore);
      }
    };
    const read = () => {
      let cachedKeys = new Set<string>();
      let rawCachedKeys = new Set<string>();
      let paintedKeys = new Set<string>();
      let cachedRaw = 0;
      let cachedAllHidden = false;
      let answered = false;
      const listener = makeFetchListener({
        onCachedMessages: (page: CometChat.BaseMessage[]) => {
          if (stale()) return;
          const raw = Array.isArray(page) ? page : [];
          const rows = shownOf(raw);
          cachedAllHidden = raw.length > 0 && rows.length === 0;
          cachedKeys = cachedKeysOf(rows);
          rawCachedKeys = cachedKeysOf(raw);
          cachedRaw = raw.length;
          const listed = cachedKeysOf(ctx.allMessagesSignal());
          paintedKeys = new Set([...cachedKeys].filter(key => !listed.has(key)));
          upsertOffline(ctx, rows);
          // Cached rows are the first paint: no loader over them.
          if (ctx.allMessagesSignal().length > 0) ctx.loadingStateSignal.set(false);
        },
        onServerMessages: (page: CometChat.BaseMessage[]) => {
          if (answered) return;
          answered = true;
          if (stale()) {
            finish(false);
            return;
          }
          const raw = Array.isArray(page) ? page : [];
          const rows = shownOf(raw);
          let result = reconcileServerPage(ctx.allMessagesSignal(), cachedKeys, rows, raw);
          // A stale cached page (it does not join this server page) is not kept (D13-R2).
          const unjoined = dropUnjoinedCachedPage(
            result.rows,
            paintedKeys,
            rawCachedKeys,
            raw,
            options.direction
          );
          if (unjoined.changed) result = unjoined;
          if (result.changed) {
            setRows(ctx, applyHeldReceipts(ctx, result.rows));
            updateCursors(ctx, result.rows);
          }
          ctx.offlineFooterSignal.set('none');
          ctx.offlineFooterRetryableSignal?.set(false);
          ctx.offlineBlocked = undefined;
          ctx.offlinePreviousExhausted = false;
          ctx.offlineReloadOnConnect = false;
          ctx.errorStateSignal.set(null);
          if (raw.length > 0 && rows.length === 0) {
            read();
            return;
          }
          ctx.loadingStateSignal.set(false);
          options.onServerApplied?.(raw, rows);
          if (isFirstFetch && rows.length > 0)
            setTimeout(() => {
              void ctx.markInitialMessagesAsRead();
            }, 100);
          flushPendingSentMessages(ctx);
          finish(raw.length > 0);
        },
        onError: (error: unknown) => {
          if (answered) return;
          answered = true;
          if (stale()) {
            finish(false);
            return;
          }
          // Offline, the next read is the next cached page: one with nothing to show reads on.
          if (cachedAllHidden && isNotConnectedError(error)) {
            read();
            return;
          }
          ctx.loadingStateSignal.set(false);
          flushPendingSentMessages(ctx);
          if (options.automatic && ctx.allMessagesSignal().length > 0) {
            finish(true);
            return;
          }
          if (ctx.allMessagesSignal().length === 0) {
            // Nothing on screen: the error state, whatever the error. When the device was not
            // connected the list shows "Connect to load messages" in place of the error view
            // (D84 rule 3), and reads once more when the connection is back (rule 8). The error
            // state is what reports it (the list's `error` output follows it), once for this load.
            CometChatLogger.error(
              'MessageListService',
              `Error fetching ${options.direction} messages (offline path):`,
              error
            );
            ctx.offlineReloadOnConnect = isNotConnectedError(error);
            ctx.offlineFooterSignal.set('none');
            ctx.offlineBlocked = undefined;
            if (ctx.errorStateSignal() === null) ctx.errorStateSignal.set(error as Error);
            ctx.errorCallback?.(error as CometChat.CometChatException);
            finish(true);
            return;
          }
          if (isNotConnectedError(error)) {
            // Showing saved messages, not an error (BEH-READ-05).
            ctx.offlineFooterSignal.set('connect_to_load_more');
            ctx.offlineBlocked = {
              previous: ctx.offlineBlocked?.previous === true || options.direction === 'previous',
              next: ctx.offlineBlocked?.next === true || options.direction === 'next',
            };
            if (options.direction === 'previous') ctx.offlinePreviousExhausted = cachedRaw === 0;
            // Not connected: tap to retry; once the connection is back, scrolling too. A read
            // that gave up after the connection was already back is retryable at once.
            ctx.offlineFooterRetryableSignal?.set(sdkConnected());
            if (isFirstFetch && ctx.allMessagesSignal().length > 0)
              setTimeout(() => {
                void ctx.markInitialMessagesAsRead();
              }, 100);
            // Saved messages stay with the footer and nothing is reported (D84 rule 2).
            finish(false);
            return;
          }
          CometChatLogger.error(
            'MessageListService',
            `Error fetching ${options.direction} messages (offline path):`,
            error
          );
          // Never blank the cached rows already shown (BEH-READ-06): no error view over them.
          ctx.errorCallback?.(error as CometChat.CometChatException);
          if (reportsFailure) ctx.reportLoadError?.(error);
          // A failed read says nothing about the end of the chat: only an empty
          // online server page ends the list (UIK-READ-03), so the next scroll or
          // tap reads again, after the connection is back or the server recovers.
          finish(true);
        },
      });
      try {
        const request: any = options.request;
        const result =
          options.direction === 'previous'
            ? request.fetchPrevious(listener)
            : request.fetchNext(listener);
        // The SDK settles its Promise too, and rejects it offline: the listener is the channel.
        // A resolution with no server callback by the next task is taken as the
        // server page, so a read can never leave the loader spinning (P6).
        if (result && typeof result.then === 'function') {
          result.then(
            (page: unknown) =>
              setTimeout(() => {
                if (!answered) listener.onServerMessages?.(Array.isArray(page) ? page : []);
              }, 0),
            (error: unknown) => {
              if (!answered) listener.onError?.(error);
            }
          );
        }
      } catch (error) {
        listener.onError?.(error);
      }
    };
    read();
  });
}

export function fetchPreviousOffline(ctx: OfflineListContext): Promise<boolean> {
  if (!ctx.messagesRequest) return Promise.resolve(false);
  return twoPhasePage(ctx, { request: ctx.messagesRequest, direction: 'previous' });
}

export function fetchNextOffline(ctx: OfflineListContext): Promise<boolean> {
  if (!ctx.nextMessagesRequest) return Promise.resolve(false);
  return twoPhasePage(ctx, { request: ctx.nextMessagesRequest, direction: 'next' });
}

/** The latest jump per list: an earlier jump still looking up its target never lands (ENG-57322). */
const latestJump = new WeakMap<object, number>();
/** Lists whose next jump is the open's own (start from the first unread); see {@link markOpeningJump}. */
const openingJumps = new WeakSet<object>();

/**
 * The next jump on `list` is the open's own (start from the first unread): it replaces the
 * newest page the open painted, as a jump on an empty list does, instead of keeping the rows
 * when the target cannot be read (Android `MessageListOfflineReads.kt` :593, `openJumpGen`).
 */
export function markOpeningJump(list: object): () => void {
  openingJumps.add(list);
  return () => openingJumps.delete(list);
}

/**
 * Jump to a message (search result, quoted reply, unread anchor): the page
 * before it and the page after it, each two-phase, from the SDK's anchored
 * read (BEH-READ-29). The region between this window and the newest page
 * loads on scroll, as today.
 *
 * From a chat with rows on screen the target is looked up first and the rows
 * are replaced only once it is found (ENG-57322, as Android
 * `MessageListOfflineReads.kt` :682-691). A target that cannot be read keeps
 * the rows exactly: no loader, no error view, nothing for the next reconnect
 * to retry; only a failure other than not-connected is reported, once
 * (Android `showRowsOrError` :375-383). Offline is told by the read failing,
 * not by the connection state, which the JS SDK updates ~15-18 s late.
 */
export async function fetchAroundOffline(
  ctx: OfflineListContext,
  messageId: number
): Promise<void> {
  const opening = openingJumps.delete(ctx);
  if (!opening && ctx.allMessagesSignal().length > 0) return jumpFromRowsOnScreen(ctx, messageId);
  ctx.clearMessagesAndState();
  const generation = ctx.fetchGeneration;
  // The target first, two-phase (BEH-READ-35): its device copy paints at once,
  // the server copy replaces it.
  const { value, error } = await getMessageDetailsTwoPhase(messageId, cached => {
    if (generation === ctx.fetchGeneration) upsertOffline(ctx, [cached]);
  });
  if (generation !== ctx.fetchGeneration) return;
  if (!value) {
    // A real failure (not "not connected") is the jump's one report: the newest page read
    // below stays quiet over rows, and with nothing shown its error view is the report.
    const targetFailed = error !== undefined && !isNotConnectedError(error);
    // Not cached and not reachable (BEH-READ-29): no window can be read around
    // it. Stay on the newest cached page, as a normal offline open does: no
    // error, and the caller finds no target row, so no scroll target. Whether
    // the SDK has noticed the lost connection yet does not matter (ENG-57322).
    const newest = ctx.buildMessagesRequest();
    await twoPhasePage(ctx, { request: newest, direction: 'previous', report: !targetFailed });
    if (generation !== ctx.fetchGeneration) return;
    const shown = ctx.allMessagesSignal();
    // With nothing on screen the failed read above is the error view (D83): keep it.
    if (shown.length > 0) ctx.errorStateSignal.set(null);
    ctx.messagesRequest = newest;
    ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newestServerId(shown) || undefined);
    ctx.loadingStateSignal.set(false);
    if (targetFailed && shown.length > 0) reportJumpTargetError(ctx, error);
    else if (targetFailed && ctx.errorStateSignal() === null) {
      // Nothing to show and the newest page read cleanly (an empty chat): the target's error is
      // the error view, as Android's showRowsOrError does with no rows.
      CometChatLogger.error('MessageListService', 'Error fetching the jump target (offline path):', error);
      ctx.errorStateSignal.set(error as Error);
      ctx.errorCallback?.(error as CometChat.CometChatException);
    }
    return;
  }
  await readWindowAround(ctx, messageId, value, generation);
}

async function jumpFromRowsOnScreen(ctx: OfflineListContext, messageId: number): Promise<void> {
  const jump = (latestJump.get(ctx) ?? 0) + 1;
  latestJump.set(ctx, jump);
  const generation = ctx.fetchGeneration;
  // No device-copy paint: the rows on screen stay until the target is known.
  const { value, error } = await getMessageDetailsTwoPhase(messageId);
  if (generation !== ctx.fetchGeneration || latestJump.get(ctx) !== jump) return;
  if (!value) {
    if (error !== undefined && !isNotConnectedError(error)) reportJumpTargetError(ctx, error);
    return;
  }
  ctx.clearMessagesAndState();
  const windowGeneration = ctx.fetchGeneration;
  upsertOffline(ctx, [value]);
  await readWindowAround(ctx, messageId, value, windowGeneration);
}

/** A jump target that could not be read for a reason other than "not connected", over rows on screen: one report. */
function reportJumpTargetError(ctx: OfflineListContext, error: unknown): void {
  CometChatLogger.error('MessageListService', 'Error fetching the jump target (offline path):', error);
  ctx.errorCallback?.(error as CometChat.CometChatException);
  ctx.reportLoadError?.(error);
}

/** The pages before and after a found (or device-cached) target, two-phase; the target is upserted between them. */
async function readWindowAround(
  ctx: OfflineListContext,
  messageId: number,
  value: CometChat.BaseMessage | null,
  generation: number
): Promise<void> {
  // One report for the whole jump: the page before the target reports, the page after does not.
  await twoPhasePage(ctx, {
    request: ctx.buildMessagesRequest(messageId),
    direction: 'previous',
    report: true,
  });
  if (generation !== ctx.fetchGeneration) return;
  if (value) upsertOffline(ctx, [value]);
  const anchor = newestServerId(ctx.allMessagesSignal()) || messageId;
  await twoPhasePage(ctx, {
    request: ctx.buildNextMessagesRequest(anchor),
    direction: 'next',
    report: false,
  });
  if (generation !== ctx.fetchGeneration) return;
  const rows = ctx.allMessagesSignal();
  ctx.messagesRequest = ctx.buildMessagesRequest(oldestServerId(rows) || undefined);
  ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newestServerId(rows) || undefined);
  ctx.loadingStateSignal.set(false);
}

/**
 * Re-read the newest window of the open chat after a PARTIAL or failed sweep:
 * one fresh two-phase read with no anchor. If the server page does not overlap
 * what is shown, more was missed than one page, so the list resets to it.
 */
export function refreshNewestWindow(ctx: OfflineListContext): Promise<boolean> {
  const before = ctx.allMessagesSignal();
  const shownIds = new Set(before.map(serverIdOf).filter(id => id > 0));
  const request = ctx.buildMessagesRequest();
  return twoPhasePage(ctx, {
    request,
    direction: 'previous',
    automatic: true,
    onServerApplied: (raw, shown) => {
      const overlaps = raw.length === 0 || raw.some(m => shownIds.has(serverIdOf(m)));
      if (overlaps || shownIds.size === 0) return;
      const unsent = ctx.allMessagesSignal().filter(m => serverIdOf(m) === 0);
      const reset = upsertSorted(shown, unsent).rows;
      setRows(ctx, reset);
      // More was missed than one page: the list now shows the newest window;
      // the screen keeps the reader at the bottom or offers "jump to latest".
      ctx.newestWindowResetSignal?.update(n => n + 1);
      ctx.prevMessageIdSignal.set(oldestServerId(reset));
      ctx.nextMessageIdSignal.set(newestServerId(reset));
      ctx.messagesRequest = request;
      ctx.nextMessagesRequest = ctx.buildNextMessagesRequest(newestServerId(reset) || undefined);
    },
  });
}

/** Draw one transition of an own send that belongs to this list. */
export function applySendState(ctx: OfflineListContext, event: SendStateEvent): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const message = event.message;
  if (!message || !ctx.isMessageForCurrentConversation(message)) return;
  markOfflinePathUsed(ctx);
  if (event.state === 'discarded') {
    const result = removeRow(ctx.allMessagesSignal(), message);
    if (result.changed) setRows(ctx, result.rows);
    return;
  }
  // Always a fresh reference: the SDK often hands back the very object the row
  // already holds, and OnPush bubbles re-render only on a new input.
  const row = shallowClone(message);
  // The copy that replaces a listed row keeps what the kit stamped on it
  // locally: the thread-subscribed flag and the quoted message (D4).
  const listed = ctx.allMessagesSignal()[findRowIndex(ctx.allMessagesSignal(), message)];
  if (listed && listed !== message) carryLocalState(listed, row);
  if (event.state === 'sending' && statusOf(message) === OfflineMessageStatus.failed) {
    // A retry is under way; the object the SDK handed back may still read FAILED.
    try {
      (row as any).setStatus?.(OfflineMessageStatus.pending);
    } catch {
      /* status stays as it was */
    }
  }
  upsertOffline(ctx, [row]);
}

/** Kit-stamped local state a replacing copy must not lose (D4). */
function carryLocalState(from: CometChat.BaseMessage, to: CometChat.BaseMessage): void {
  if (readThreadSubscribed(from) && !readThreadSubscribed(to)) writeThreadSubscribed(to, true);
  const quoted = (from as any).getQuotedMessage?.();
  if (quoted && !(to as any).getQuotedMessage?.()) {
    try {
      (to as any).setQuotedMessage?.(quoted);
    } catch {
      /* the SDK copy keeps its own */
    }
  }
}

/** Same prototype and own properties (local attachment shims included), new reference. */
export function shallowClone<T extends object>(message: T): T {
  return Object.create(
    Object.getPrototypeOf(message),
    Object.getOwnPropertyDescriptors(message)
  ) as T;
}

/**
 * The sweep finished: upsert every message of `messages` for this chat in
 * sorted place (the only path for action and call rows, BEH-SYNC-25), then
 * refresh the newest window if the sweep was PARTIAL.
 */
export function applyMessageSync(ctx: OfflineListContext, event: MessageSyncEvent): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const forThisChat = event.messages.filter(m => {
    if (!m || !ctx.isMessageForCurrentConversation(m)) return false;
    if (ctx.hideGroupActionMessages && m.getCategory?.() === 'action') return false;
    if (ctx.acceptsSweptRow && !ctx.acceptsSweptRow(m)) return false;
    return true;
  });
  ctx.heldReceipts.clear();
  if (forThisChat.length > 0) upsertOffline(ctx, forThisChat);
  if (event.outcome === 'PARTIAL') void refreshNewestWindow(ctx);
}

/** `onMessagesSynced`: update rows shown; never insert (BEH-INV-11). */
export function applyMessagesUpdated(ctx: OfflineListContext, event: MessagesUpdatedEvent): void {
  if (event.gen !== OfflineHub.getInstance().gen) return;
  const rows = ctx.allMessagesSignal();
  const shown = event.messages.filter(m => m && findRowIndex(rows, m) !== -1);
  if (shown.length > 0) upsertOffline(ctx, shown);
}

/**
 * Kill switch (UIK-LIFE-03): offline turned off while un-acked rows are shown.
 * They turn failed (direct), with Retry as a fresh send, and one notice.
 */
export function failStrandedSends(ctx: OfflineListContext): void {
  if (!ctx.offlinePathUsed) return;
  const hub = OfflineHub.getInstance();
  const stranded = ctx
    .allMessagesSignal()
    .filter(
      m =>
        serverIdOf(m) === 0 &&
        (hub.takeStranded(m) ||
          ((isSending(m) || localIdOf(m) !== '') &&
            hub.directFailureOf(m) === undefined &&
            statusOf(m) !== OfflineMessageStatus.failed))
    );
  if (stranded.length === 0) return;
  for (const message of stranded) hub.reportSendState(message, 'failed', { direct: true });
  // Every stranded row is of THIS list, so the first says which list the notice
  // belongs to. Without it the notice has no chat and no thread level, and each
  // mounted list showed it - the other conversation and the thread panel
  // included - as the per-message notices never do.
  hub.notice$.next({
    gen: hub.gen,
    kind: 'messages_not_sent',
    count: stranded.length,
    scopeMessage: stranded[0],
  });
}
