/**
 * OfflineHub: the kit's single bridge from the Chat SDK's offline listeners to
 * the screens that are mounted.
 *
 * - Started by `CometChatUIKit.init()` / `initFromSettings()` once the SDK's own
 *   init has resolved; never at import. Idempotent.
 * - Registers each SDK listener once, under its own id, and only those the
 *   installed SDK has. They are inert while offline is off: the SDK never fires
 *   them.
 * - Never unregistered on logout (SDK registrations survive logout/login). A
 *   logout or user switch clears the hub's own bookkeeping and bumps `gen`, so
 *   late callbacks from the old session are dropped by every screen.
 * - Fans out on private RxJS subjects, never on the kit's public event bus.
 *   Integrators get only the additive public events (`ccMessageSendStateChanged`,
 *   `ccOfflineCacheReset`) plus the existing `ccMessageSent`, emitted once per
 *   transition per `localMessageId`.
 *
 * Framework-free on purpose; `OfflineHubService` adapts it to Angular's zone.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Subject, Subscription } from 'rxjs';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import {
  CometChatGroupEvents,
  IGroupLeft,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
} from '../../events/CometChatGroupEvents';
import { isGroupMemberAction } from './swept-group-actions';
import { MessageSendState } from '../../events/CometChatMessageEvents.types';
import { MessageStatus } from '../../Enums/Enums';
import { CometChatLogger } from '../CometChatLogger';
import { hasOfflineSdk, hasSdkFunction, OfflineCallback, offlineSdk } from './offline-gate';
import { localIdOf, muidOf, OfflineFailureReason, serverIdOf } from './identity';

/** The kit's send state for one own message. */
export type OfflineSendState = MessageSendState;

export interface SendStateEvent {
  gen: number;
  localMessageId: string;
  message: CometChat.BaseMessage;
  state: OfflineSendState;
  /** `MessageFailureReason` for `failed` / `discarded`. */
  reason?: string;
  /**
   * A failure the outbox does not hold (an error with no prior pending, or a
   * queue-full / byte-overflow refusal): its Retry is a fresh send.
   */
  direct?: boolean;
}

export interface MessageSyncEvent {
  gen: number;
  messages: CometChat.BaseMessage[];
  outcome: string;
}
export interface ConversationSyncEvent {
  gen: number;
  conversations: CometChat.Conversation[];
}
export interface MessagesUpdatedEvent {
  gen: number;
  messages: CometChat.BaseMessage[];
}
export interface CacheResetEvent {
  gen: number;
  reason: string;
  pendingMessagesLost: number | null;
}
export interface MediaReadyEvent {
  gen: number;
  messageKey: string;
  urlKey: string;
  localPath: string;
}
export interface SyncFailedEvent {
  gen: number;
  phase: 'conversation' | 'message';
  error: unknown;
}

/** A user-facing notice; the message list and conversation list render these. */
export type OfflineNoticeKind =
  | 'unsent_message_removed'
  | 'queue_full'
  | 'file_too_large_offline'
  | 'messages_not_sent'
  | 'unsent_messages_lost'
  | 'unsent_messages_maybe_lost'
  /** Retry or Delete tapped while the send is under way (R162): try again shortly. */
  | 'send_in_flight';

export interface OfflineNotice {
  gen: number;
  kind: OfflineNoticeKind;
  count?: number;
  /** The removed message, for Copy (text only). */
  message?: CometChat.BaseMessage;
  /**
   * A message the notice is about, when it is about several: it says which list
   * the notice belongs to (its chat and its thread level) without offering the
   * single-message affordances `message` carries.
   */
  scopeMessage?: CometChat.BaseMessage;
  /** Conversation the notice belongs to, when it belongs to one. */
  conversationId?: string;
}

const LISTENER_IDS = Object.freeze({
  outbox: 'uikit_offline_hub_outbox',
  sync: 'uikit_offline_hub_sync',
  cacheReset: 'uikit_offline_hub_cache_reset',
  media: 'uikit_offline_hub_media',
  messagesSynced: 'uikit_offline_hub_messages_synced',
  login: 'uikit_offline_hub_login',
});

const MAX_TRACKED_SENDS = 500;

/**
 * Writes `key` as the newest entry of a per-session mark and drops the
 * oldest-written entries beyond {@link MAX_TRACKED_SENDS} (ANG-8). Android
 * bounds its direct-failure ids the same way (`OfflineSend.kt:107-118`, 512,
 * LRU); 500 matches the other caps in this file. Reads do not refresh an entry:
 * they run on every render.
 */
function writeNewest<V>(marks: Map<string, V>, key: string, value: V): void {
  marks.delete(key);
  marks.set(key, value);
  capOldest(marks);
}

/** {@link writeNewest} for a mark kept as a set. */
function addNewest(marks: Set<string>, key: string): void {
  marks.delete(key);
  marks.add(key);
  capOldest(marks);
}

function capOldest(marks: Map<string, unknown> | Set<string>): void {
  while (marks.size > MAX_TRACKED_SENDS) {
    const oldest = marks.keys().next().value;
    if (oldest === undefined) return;
    marks.delete(oldest);
  }
}

/** Forward-only transitions; `failed → sending` is a retry, anything may become `sent`. */
function isForward(from: OfflineSendState | undefined, to: OfflineSendState): boolean {
  if (from === undefined) return true;
  if (from === to) return false;
  if (to === 'sent') return from !== 'discarded';
  if (from === 'sent' || from === 'discarded') return false;
  if (from === 'failed') return to === 'sending' || to === 'discarded';
  return true;
}

export class OfflineHub {
  private static instance: OfflineHub | null = null;

  static getInstance(): OfflineHub {
    if (!OfflineHub.instance) OfflineHub.instance = new OfflineHub();
    return OfflineHub.instance;
  }

  /** Tests only: drop the singleton so each test starts clean. */
  static resetForTests(): void {
    OfflineHub.instance = null;
  }

  readonly sendState$ = new Subject<SendStateEvent>();
  readonly messageSync$ = new Subject<MessageSyncEvent>();
  readonly syncFailed$ = new Subject<SyncFailedEvent>();
  readonly conversationSync$ = new Subject<ConversationSyncEvent>();
  readonly messagesUpdated$ = new Subject<MessagesUpdatedEvent>();
  readonly cacheReset$ = new Subject<CacheResetEvent>();
  readonly mediaReady$ = new Subject<MediaReadyEvent>();
  readonly notice$ = new Subject<OfflineNotice>();
  /** Emits the new `gen` after a logout, user switch or cache reset. */
  readonly session$ = new Subject<number>();
  /**
   * Emits the current `gen` when a user signs in, including the first sign-in
   * of a run (which ends no session, so `session$` stays quiet). Anything that
   * reads the offline gate or the connection as a cached value needs this: the
   * gate can only answer once the SDK has a session, so a value read before
   * the sign-in is stale from then on.
   */
  readonly login$ = new Subject<number>();
  /** Emits the new `gen` after a logout or user switch only (not a cache reset). */
  readonly sessionEnd$ = new Subject<number>();

  private started = false;
  private genValue = 0;
  /**
   * Notices raised before any screen could listen. The SDK delivers a reset from
   * the offline start right after `init` resolves, and an app bootstraps after
   * `CometChatUIKit.init`, so `OfflineHubService` claims these when it is created.
   */
  private unclaimedNotices: OfflineNotice[] | null = [];
  private sessionUid: string | null = null;
  /** Last state emitted publicly, per `localMessageId` (ON path only). */
  private readonly lastState = new Map<string, OfflineSendState>();
  /** Conversations whose read could not reach the server while offline. */
  private readonly readWhileOffline = new Map<string, { id: string; type: string }>();
  /**
   * The same conversations, kept after the receipts flush (AC-7.4, D3 on #674).
   * The SDK's conversation phase completes before the message phase that
   * triggers the flush, so its sync page still carries the server's stale
   * unread count and would put the badge back on a chat this device has read.
   * An id stays here until a new message makes the chat unread for real.
   */
  private readonly readLocally = new Set<string>();
  /**
   * Own messages that failed without entering the outbox (failed "direct"),
   * keyed by muid. They have no FAILED status to derive from, so this in-memory
   * mark is the only record, and it lasts the session, as a failed send does
   * today.
   */
  private readonly directFailures = new Map<string, string>();
  /**
   * The `MessageFailureReason` last reported per `localMessageId`, for a row
   * whose model does not carry `failureReason` (an object the SDK handed back
   * before it projected the field). Cleared when the message leaves `failed`.
   */
  private readonly failureReasons = new Map<string, string>();
  /** Sends a preview turned failed under the kill switch, by muid; see {@link markStranded}. */
  private readonly strandedUnnoticed = new Set<string>();
  /** Swept group actions already emitted on CometChatGroupEvents (by message id). */
  private readonly sweptActionIds = new Set<string>();
  /**
   * Own messages whose refusal (queue full, file too large offline) already
   * raised its notice, by `localMessageId` (else muid). The SDK reports one
   * refusal twice, to the send's own `onError` and to the global outbox
   * listener; the notice shows once.
   */
  private readonly refusalNotices = new Set<string>();
  /**
   * Own messages the user deleted while the SDK no longer held them, by
   * `localMessageId`: if a sent copy still arrives, it is deleted on the server.
   */
  private readonly deleteOnSent = new Set<string>();

  /** The hub's own record of notices no screen has claimed yet; it lives as long as the hub. */
  private readonly unclaimedNoticeSubscription: Subscription;

  constructor() {
    this.unclaimedNoticeSubscription = this.notice$.subscribe(notice => {
      this.unclaimedNotices = this.unclaimedNotices && [...this.unclaimedNotices.slice(-9), notice];
    });
  }

  get gen(): number {
    return this.genValue;
  }
  get isStarted(): boolean {
    return this.started;
  }

  /** Hand over the notices of this session raised so far; called once, by the service that shows them. */
  claimNotices(): OfflineNotice[] {
    const notices = (this.unclaimedNotices ?? []).filter(notice => notice.gen === this.genValue);
    this.unclaimedNotices = null;
    return notices;
  }

  /**
   * Register the SDK listeners. Safe to call from every init entry point and
   * more than once; only the first call registers.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    // An SDK below the offline floor (4.2.x, or 4.3.0 without the 4.3.1 fixes)
    // gets nothing registered at all, so the kit behaves exactly as before.
    if (!hasOfflineSdk()) return;
    const sdk = offlineSdk();
    this.register(
      'addOfflineMessageListener',
      LISTENER_IDS.outbox,
      {
        onOutboxMessagePending: (m: CometChat.BaseMessage) => this.onOutboxPending(m),
        onOutboxMessageSent: (m: CometChat.BaseMessage) => this.onOutboxSent(m),
        onOutboxMessageFailed: (m: CometChat.BaseMessage, reason: unknown) =>
          this.onOutboxFailed(m, reason),
      },
      sdk.OfflineMessageListener
    );
    this.register(
      'addSyncListener',
      LISTENER_IDS.sync,
      {
        onConversationSyncCompleted: (list: CometChat.Conversation[]) =>
          this.conversationSync$.next({
            gen: this.genValue,
            conversations: Array.isArray(list) ? list : [],
          }),
        onConversationSyncError: (error: unknown) =>
          this.syncFailed$.next({ gen: this.genValue, phase: 'conversation', error }),
        onMessageSyncCompleted: (list: CometChat.BaseMessage[], outcome: unknown) =>
          this.onMessageSyncCompleted(list, outcome),
        onMessageSyncError: (error: unknown) =>
          this.syncFailed$.next({ gen: this.genValue, phase: 'message', error }),
      },
      sdk.SyncListener
    );
    this.register(
      'addOfflineCacheResetListener',
      LISTENER_IDS.cacheReset,
      {
        onOfflineCacheReset: (reason: unknown, lost: unknown) => this.onCacheReset(reason, lost),
      },
      sdk.OfflineCacheResetListener
    );
    this.register(
      'addMediaDownloadListener',
      LISTENER_IDS.media,
      {
        onMediaDownloaded: (messageKey: unknown, urlKey: unknown, localPath: unknown) =>
          this.mediaReady$.next({
            gen: this.genValue,
            messageKey: String(messageKey ?? ''),
            urlKey: String(urlKey ?? ''),
            localPath: String(localPath ?? ''),
          }),
      },
      sdk.MediaDownloadListener
    );
    try {
      CometChat.addMessageListener(
        LISTENER_IDS.messagesSynced,
        new CometChat.MessageListener({
          onMessagesSynced: (list: CometChat.BaseMessage[]) =>
            this.messagesUpdated$.next({
              gen: this.genValue,
              messages: Array.isArray(list) ? list : [],
            }),
        } as any)
      );
    } catch (e) {
      CometChatLogger.error('OfflineHub', 'Could not register the synced-messages listener:', e);
    }
    try {
      CometChat.addLoginListener(
        LISTENER_IDS.login,
        new CometChat.LoginListener({
          loginSuccess: (user: CometChat.User) => this.onLogin(user),
          logoutSuccess: () => this.endSession(),
        })
      );
    } catch (e) {
      CometChatLogger.error('OfflineHub', 'Could not register the login listener:', e);
    }
  }

  private register(
    method: string,
    id: string,
    handlers: Record<string, OfflineCallback>,
    ListenerClass: any
  ): void {
    if (!hasSdkFunction(method)) return;
    try {
      const listener = typeof ListenerClass === 'function' ? new ListenerClass(handlers) : handlers;
      offlineSdk()[method](id, listener);
    } catch (e) {
      CometChatLogger.error('OfflineHub', `Could not register ${method}:`, e);
    }
  }

  // ── Session ──────────────────────────────────────────────────────────────

  /** Record who is signed in; a different uid ends the previous session first. */
  onLogin(user: CometChat.User | null | undefined): void {
    const uid = user?.getUid?.() ?? null;
    if (this.sessionUid !== null && uid !== this.sessionUid) this.endSession();
    this.sessionUid = uid;
    this.login$.next(this.genValue);
  }

  /** Logout, user switch or cache reset: forget every per-session mark and bump `gen`. */
  endSession(): void {
    this.lastState.clear();
    this.readWhileOffline.clear();
    this.readLocally.clear();
    this.directFailures.clear();
    this.failureReasons.clear();
    this.strandedUnnoticed.clear();
    this.sweptActionIds.clear();
    this.refusalNotices.clear();
    this.deleteOnSent.clear();
    this.sessionUid = null;
    this.genValue++;
    this.session$.next(this.genValue);
    this.sessionEnd$.next(this.genValue);
  }

  // ── Sends ────────────────────────────────────────────────────────────────

  /**
   * Report one transition of an own message's send. Both the per-send listener
   * and the outbox listener funnel through here, so each transition reaches the
   * screens and the public events exactly once per `localMessageId`.
   *
   * `announced` marks a `sending` the caller already announced publicly (the
   * composer emits `inprogress` at compose time), so it is not announced twice.
   */
  reportSendState(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    options: { reason?: string; direct?: boolean; announced?: boolean; byUser?: boolean } = {}
  ): boolean {
    const localMessageId = localIdOf(message);
    if (state === 'failed' && options.direct) this.markDirectFailed(message, options.reason ?? '');
    else if (state !== 'failed') this.clearDirectFailed(message);
    if (!localMessageId) {
      // Without a local id there is nothing to dedupe on; a direct failure of a
      // message the SDK never queued still has to reach the screen, and so does
      // its removal from the screen (Delete of a failed-direct row).
      if (state === 'failed' || state === 'discarded') {
        this.sendState$.next({
          gen: this.genValue,
          localMessageId: '',
          message,
          state,
          reason: options.reason,
          direct: true,
        });
        if (state === 'failed') this.emitPublic(message, state, options.reason);
        else this.emitStateChanged(message, state, options.reason);
        return true;
      }
      return false;
    }
    if (state === 'sent' && this.deleteOnSent.delete(localMessageId) && serverIdOf(message) > 0) {
      CometChat.deleteMessage(String(serverIdOf(message))).catch((error: unknown) =>
        CometChatLogger.warn('OfflineHub', 'deleting a removed message on the server failed:', error)
      );
    }
    const previous = this.lastState.get(localMessageId);
    if (!isForward(previous, state)) return false;
    if (state === 'failed' && options.reason)
      writeNewest(this.failureReasons, localMessageId, options.reason);
    else if (state !== 'failed') this.failureReasons.delete(localMessageId);
    this.track(localMessageId, state);
    this.sendState$.next({
      gen: this.genValue,
      localMessageId,
      message,
      state,
      reason: options.reason,
      direct: options.direct,
    });
    // A Delete the user chose is not a send failure: only the state change is
    // public (ccMessageSent keeps meaning sent / in progress / failed).
    const quiet = state === 'discarded' && options.byUser;
    if (!quiet && !(state === 'sending' && (options.announced || previous === undefined))) {
      this.emitPublic(message, state, options.reason);
    } else {
      this.emitStateChanged(message, state, options.reason);
    }
    return true;
  }

  /** Delete the sent copy of `localMessageId` on the server if it still arrives. */
  deleteWhenSent(localMessageId: string): void {
    if (localMessageId) this.deleteOnSent.add(localMessageId);
  }

  /** The state last reported for `localMessageId`, if any. */
  stateOf(localMessageId: string): OfflineSendState | undefined {
    return this.lastState.get(localMessageId);
  }

  /** Mark an own message failed (direct): not in the outbox, Retry is a fresh send. */
  markDirectFailed(message: CometChat.BaseMessage, reason: string): void {
    const muid = muidOf(message);
    if (muid) writeNewest(this.directFailures, muid, reason);
  }

  clearDirectFailed(message: CometChat.BaseMessage): void {
    const muid = muidOf(message);
    if (muid) this.directFailures.delete(muid);
    // A message that leaves the failed state and is refused again is a new refusal.
    this.refusalNotices.delete(localIdOf(message));
    if (muid) this.refusalNotices.delete(muid);
  }

  /** The failure reason the hub last saw for `message` this session, or `''`. */
  failureReasonOf(message: CometChat.BaseMessage | null | undefined): string {
    const local = localIdOf(message);
    return (local && this.failureReasons.get(local)) || this.directFailureOf(message) || '';
  }

  /**
   * Kill switch: a conversation preview turned this un-acked send failed. The
   * message list, which raises the one notice, still counts it when it checks.
   */
  markStranded(message: CometChat.BaseMessage): void {
    const muid = muidOf(message);
    if (muid) addNewest(this.strandedUnnoticed, muid);
    this.reportSendState(message, 'failed', { direct: true });
  }

  /** Whether `message` was turned failed by {@link markStranded} and no notice has counted it; clears the mark. */
  takeStranded(message: CometChat.BaseMessage): boolean {
    return this.strandedUnnoticed.delete(muidOf(message));
  }

  /** The failure reason when `message` failed direct this session, else `undefined`. */
  directFailureOf(message: CometChat.BaseMessage | null | undefined): string | undefined {
    const muid = muidOf(message);
    return muid ? this.directFailures.get(muid) : undefined;
  }

  private track(localMessageId: string, state: OfflineSendState): void {
    this.lastState.delete(localMessageId);
    this.lastState.set(localMessageId, state);
    if (this.lastState.size > MAX_TRACKED_SENDS) {
      const oldest = this.lastState.keys().next().value;
      if (oldest !== undefined) this.lastState.delete(oldest);
    }
  }

  /**
   * How the public events are delivered. Framework-free by default; `OfflineHubService` sets it to
   * run them inside Angular's zone, as the SDK callbacks that cause them arrive outside it.
   */
  private publicRunner: (emit: () => void) => void = emit => emit();
  setPublicRunner(run: (emit: () => void) => void): void {
    this.publicRunner = run;
  }

  private emitPublic(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    this.publicRunner(() => this.emitPublicNow(message, state, reason));
  }

  private emitPublicNow(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    const status =
      state === 'sent'
        ? MessageStatus.success
        : state === 'sending'
          ? MessageStatus.inprogress
          : MessageStatus.error;
    try {
      CometChatMessageEvents.ccMessageSent.next({ message, status });
    } catch (e) {
      CometChatLogger.error('OfflineHub', 'ccMessageSent subscriber threw:', e);
    }
    this.emitStateChanged(message, state, reason);
  }

  private emitStateChanged(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    this.publicRunner(() => this.emitStateChangedNow(message, state, reason));
  }

  private emitStateChangedNow(
    message: CometChat.BaseMessage,
    state: OfflineSendState,
    reason?: string
  ): void {
    try {
      CometChatMessageEvents.ccMessageSendStateChanged.next({ message, state, reason });
    } catch (e) {
      CometChatLogger.error('OfflineHub', 'ccMessageSendStateChanged subscriber threw:', e);
    }
  }

  private onOutboxPending(message: CometChat.BaseMessage): void {
    // A retry turns a failed row back into a sending one; a fresh send was
    // already announced by its composer.
    this.reportSendState(message, 'sending', {
      announced: this.lastState.get(localIdOf(message)) !== 'failed',
    });
  }

  private onOutboxSent(message: CometChat.BaseMessage): void {
    this.reportSendState(message, 'sent');
  }

  private onOutboxFailed(message: CometChat.BaseMessage, rawReason: unknown): void {
    const reason = normalizeReason(rawReason);
    if (
      reason === OfflineFailureReason.discarded ||
      reason === OfflineFailureReason.queueOverflow
    ) {
      if (this.reportSendState(message, 'discarded', { reason })) {
        this.notice$.next({
          gen: this.genValue,
          kind: 'unsent_message_removed',
          count: 1,
          message,
          conversationId: conversationIdOf(message),
        });
      }
      return;
    }
    const direct =
      reason === OfflineFailureReason.queueFull || reason === OfflineFailureReason.byteOverflow;
    const isNew = this.reportSendState(message, 'failed', { reason, direct });
    if (!direct) return;
    if (!isNew) {
      // The send's own onError reported the failure first, maybe without a
      // reason; this callback names the refusal for certain, so it is kept.
      this.markDirectFailed(message, reason);
      const local = localIdOf(message);
      if (local) writeNewest(this.failureReasons, local, reason);
    }
    this.raiseRefusalNotice(message, reason);
  }

  /**
   * The notice for a send the outbox refused (`QUEUE_FULL`, `BYTE_OVERFLOW`),
   * raised once per message whichever SDK callback reports the refusal first
   * (UIK-SEND-03). Any other reason raises nothing.
   */
  raiseRefusalNotice(message: CometChat.BaseMessage, reason: string): void {
    if (reason !== OfflineFailureReason.queueFull && reason !== OfflineFailureReason.byteOverflow)
      return;
    const key = localIdOf(message) || muidOf(message);
    if (key) {
      if (this.refusalNotices.has(key)) return;
      this.refusalNotices.add(key);
      if (this.refusalNotices.size > MAX_TRACKED_SENDS) {
        const oldest = this.refusalNotices.values().next().value;
        if (oldest !== undefined) this.refusalNotices.delete(oldest);
      }
    }
    this.notice$.next({
      gen: this.genValue,
      kind: reason === OfflineFailureReason.queueFull ? 'queue_full' : 'file_too_large_offline',
      message,
      conversationId: conversationIdOf(message),
    });
  }

  // ── Sync, reset ──────────────────────────────────────────────────────────

  private onMessageSyncCompleted(list: CometChat.BaseMessage[], outcome: unknown): void {
    const messages = Array.isArray(list) ? list : [];
    this.messageSync$.next({ gen: this.genValue, messages, outcome: String(outcome ?? '') });
    this.emitSweptGroupEvents(messages);
    this.flushReadsMadeOffline();
  }

  /**
   * Swept group actions (README §3.7, UIT-SYNC-13): a kick, ban or scope
   * change made while the device was away comes only in the sweep, never on
   * the SDK's GroupListener. The kit emits its existing CometChatGroupEvents for
   * it, with the payload the live listener's arguments map to, so every screen
   * (and the host app) that reacts to those events updates as for a live one:
   * a kicked or banned user's chat stops being writable, counts and member
   * lists update. A leave is emitted only when the signed-in user left (from
   * another device). Once per action; never with offline off (no sweep then).
   */
  private emitSweptGroupEvents(messages: readonly CometChat.BaseMessage[]): void {
    for (const message of messages) {
      if (!isGroupMemberAction(message)) continue;
      const key = String((message as any).getId?.() ?? '');
      if (!key || this.sweptActionIds.has(key)) continue;
      const m = message as any;
      const on = m.getActionOn?.();
      const by = m.getActionBy?.();
      const group = m.getActionFor?.();
      if (!group) continue;
      // Marked before the event goes out, so a subscriber can ask wasSwept()
      // while it is handling the event.
      this.trackSweptAction(key);
      try {
        switch (m.getAction?.()) {
          case 'kicked':
            CometChatGroupEvents.ccGroupMemberKicked.next({
              message: m,
              kickedUser: on,
              kickedBy: by,
              kickedFrom: group,
            } as IGroupMemberKickedBanned);
            break;
          case 'banned':
            CometChatGroupEvents.ccGroupMemberBanned.next({
              message: m,
              kickedUser: on,
              kickedBy: by,
              kickedFrom: group,
            } as IGroupMemberKickedBanned);
            break;
          case 'scopeChanged':
            CometChatGroupEvents.ccGroupMemberScopeChanged.next({
              message: m,
              updatedUser: on,
              scopeChangedTo: m.getNewScope?.(),
              scopeChangedFrom: m.getOldScope?.(),
              group,
            } as IGroupMemberScopeChanged);
            break;
          case 'left':
            // Only the signed-in user leaving from another device is a leave here.
            if (this.sessionUid && by?.getUid?.() === this.sessionUid) {
              CometChatGroupEvents.ccGroupLeft.next({
                message: m,
                userLeft: by,
                leftGroup: group,
              } as IGroupLeft);
            }
            break;
          default:
            break;
        }
      } catch (e) {
        CometChatLogger.error('OfflineHub', 'A group event subscriber threw:', e);
      }
    }
  }

  /**
   * Whether this group action reached the UI from a catch-up sweep rather than
   * live. A swept action is history: the server snapshots the conversation sync
   * delivered just before it are newer, so a screen must not treat the group
   * the action carries as the current one (BEH-SYNC-25).
   *
   * @internal
   */
  wasSwept(message: CometChat.BaseMessage | null | undefined): boolean {
    const key = String((message as any)?.getId?.() ?? '');
    return key !== '' && this.sweptActionIds.has(key);
  }

  private trackSweptAction(key: string): void {
    this.sweptActionIds.add(key);
    if (this.sweptActionIds.size > MAX_TRACKED_SENDS) {
      const oldest = this.sweptActionIds.values().next().value;
      if (oldest !== undefined) this.sweptActionIds.delete(oldest);
    }
  }

  private onCacheReset(rawReason: unknown, rawLost: unknown): void {
    const reason = String(rawReason ?? '');
    const lostNumber =
      typeof rawLost === 'number' ? rawLost : rawLost == null ? null : Number(rawLost);
    const pendingMessagesLost =
      lostNumber === null || !Number.isFinite(lostNumber) || lostNumber < 0 ? null : lostNumber;
    // Everything on screen came from the old cache: every list reloads.
    this.lastState.clear();
    this.failureReasons.clear();
    this.genValue++;
    this.session$.next(this.genValue);
    this.cacheReset$.next({ gen: this.genValue, reason, pendingMessagesLost });
    this.publicRunner(() => {
      try {
        CometChatMessageEvents.ccOfflineCacheReset.next({ reason, pendingMessagesLost });
      } catch (e) {
        CometChatLogger.error('OfflineHub', 'ccOfflineCacheReset subscriber threw:', e);
      }
    });
    // ENCRYPTION_CHANGED already reported each lost send as DISCARDED: no extra notice.
    if (reason === 'ENCRYPTION_CHANGED') return;
    if (pendingMessagesLost !== null && pendingMessagesLost > 0) {
      this.notice$.next({
        gen: this.genValue,
        kind: 'unsent_messages_lost',
        count: pendingMessagesLost,
      });
    } else if (pendingMessagesLost === null) {
      this.notice$.next({ gen: this.genValue, kind: 'unsent_messages_maybe_lost' });
    }
  }

  // ── Reads made offline (AC-7.4) ──────────────────────────────────────────

  /** Remember a conversation whose read receipt could not reach the server. */
  rememberReadWhileOffline(receiverId: string, receiverType: string): void {
    if (!receiverId || !receiverType) return;
    writeNewest(this.readWhileOffline, `${receiverType}:${receiverId}`, {
      id: receiverId,
      type: receiverType,
    });
    this.readLocally.add(localReadKey(receiverId, receiverType));
  }

  /**
   * Has this device read this conversation while offline, with the server not
   * known to agree yet? A list that applies a server row keeps the count at
   * zero while this holds (D3).
   */
  wasReadLocally(entityId: string, conversationType: string): boolean {
    if (!entityId || !conversationType) return false;
    return this.readLocally.has(localReadKey(entityId, conversationType));
  }

  /**
   * A new message has made this conversation unread again, so the local read
   * no longer speaks for it: let the server's count through from now on.
   */
  forgetLocalRead(entityId: string, conversationType: string): void {
    if (!entityId || !conversationType) return;
    this.readLocally.delete(localReadKey(entityId, conversationType));
  }

  private flushReadsMadeOffline(): void {
    if (this.readWhileOffline.size === 0) return;
    const pending = Array.from(this.readWhileOffline.values());
    this.readWhileOffline.clear();
    for (const { id, type } of pending) {
      try {
        const result: any = (CometChat as any).markConversationAsRead?.(id, type);
        if (result && typeof result.catch === 'function')
          result.catch(() => this.rememberReadWhileOffline(id, type));
      } catch {
        this.rememberReadWhileOffline(id, type);
      }
    }
  }
}

/** One key for a conversation read on this device, as both ends spell it. */
function localReadKey(entityId: string, conversationType: string): string {
  return `${conversationType}:${entityId}`;
}

function normalizeReason(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  const code = (raw as any)?.code ?? (raw as any)?.reason;
  return typeof code === 'string' ? code : '';
}

/** The conversation id a message belongs to, when the SDK has stamped it. */
export function conversationIdOf(message: CometChat.BaseMessage | null | undefined): string {
  try {
    const id = (message as any)?.getConversationId?.();
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}
